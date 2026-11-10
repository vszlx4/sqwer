/*
 * Pronunciation check. `node pronounce.ts`
 * Whisper often hears a wrong vowel as the right word, so the score misses errors like niche → "n-itch". This lists
 * the words where the two American sources disagree, espeak (Kitten, Piper, Kokoro int8) and Kokoro's US lexicon,
 * with the local dictionary (dictionary.db, gitignored; one reading per entry, any accent) as a third opinion.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { phonemes } from './engines.ts';
import { BENCH_DIR, modelDir } from './models.ts';
import { WORDS } from './words.ts';

const DB = process.env.DICTIONARY_DB ?? path.resolve(import.meta.dirname, '../../dictionary.db');
if (!existsSync(DB)) throw new Error(`no dictionary at ${DB}; set DICTIONARY_DB`);
const db = new DatabaseSync(DB, { readOnly: true });
const lookup = db.prepare(
	`select distinct e.ipa from words w join entries e on e.word_id = w.id
	 where w.word_norm = ? and e.lang_code = 'en' and e.ipa is not null and e.ipa != ''`
);

/** Kokoro's US lexicon (misaki symbols spelled out). */
const MISAKI: Record<string, string> = { A: 'eɪ', I: 'aɪ', W: 'aʊ', Y: 'ɔɪ', O: 'oʊ', Q: 'əʊ', ʧ: 'tʃ', ʤ: 'dʒ', ᵊ: 'ə', ᵻ: 'ɪ' };
const lexicon = new Map(
	readFileSync(path.join(modelDir('kokoro-multi-lang-v1_0'), 'lexicon-us-en.txt'), 'utf8')
		.split('\n')
		.map((l) => l.split(' '))
		.map(([w, ...ph]) => [w!, ph.map((p) => MISAKI[p] ?? p).join('')] as const)
);

/** Broad phonemes: no stress, length, syllable marks or diacritics; accent-level vowel splits merged. */
export function broad(ipa: string): string[] {
	const s = ipa
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/oː/g, 'ɔ')
		.replace(/[/[\]().ˈˌːˑ‿ʰʲˀ\s-]/g, '')
		.replace(/[ɹrʁ]/g, 'r')
		.replace(/ɚ/g, 'ər')
		.replace(/ɝ/g, 'ɜr')
		.replace(/ɫ/g, 'l')
		.replace(/ɡ/g, 'g')
		.replace(/ɾ/g, 't')
		.replace(/[ɐᵻ]/g, 'ə')
		.replace(/ɜ(?!r)/g, 'ɜr')
		.replace(/ɒ/g, 'ɑ')
		.replace(/əʊ/g, 'oʊ')
		.replace(/e(?!ɪ)/g, 'ɛ')
		.replace(/(?<=[ɑɔɛɪʊəɜ])r$/g, '');
	const out: string[] = [];
	for (const ch of s) {
		const last = out.at(-1);
		// affricates and diphthongs as one sound
		if ((last === 't' && ch === 'ʃ') || (last === 'd' && ch === 'ʒ')) out[out.length - 1] = last + ch;
		else if (last && /^[aɔoɛe]$/.test(last) && /[ɪʊ]/.test(ch)) out[out.length - 1] = last + ch;
		else out.push(ch);
	}
	return out;
}

function distance(a: string[], b: string[]): number {
	const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0]![j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
	return d[a.length]![b.length]!;
}

type Row = { word: string; espeak: string; kokoro: string; dictionary: string[]; off: number; dictionarySides: string };
const rows: Row[] = [];
for (const word of WORDS) {
	const dictionary = (lookup.all(word) as { ipa: string }[]).map((r) => r.ipa);
	const espeak = await phonemes(word, 'espeak');
	const kokoro = lexicon.get(word) ?? '';
	const off = kokoro ? distance(broad(espeak), broad(kokoro)) : -1;
	const near = (x: string) => Math.min(...dictionary.map((ipa) => distance(broad(x), broad(ipa))));
	const dictionarySides = !dictionary.length || !kokoro ? '–' : near(espeak) < near(kokoro) ? 'espeak' : near(kokoro) < near(espeak) ? 'lexicon' : 'neither';
	rows.push({ word, espeak, kokoro, dictionary, off, dictionarySides });
}

const split = rows.filter((r) => r.off > 0);
const missing = rows.filter((r) => r.off < 0).map((r) => r.word);
const md = [
	'# Pronunciation check',
	'',
	`${WORDS.length} words. ${split.length} where espeak and Kokoro's US lexicon differ (broadly); the dictionary column says which it is closer to.`,
	'',
	'| Word | espeak en-us | Kokoro lexicon | Dictionary | Closer |',
	'| --- | --- | --- | --- | --- |',
	...split.map((r) => `| ${r.word} | ${r.espeak} | ${r.kokoro} | ${r.dictionary.join(' · ')} | ${r.dictionarySides} |`),
	'',
	`Not in Kokoro's lexicon: ${missing.join(', ') || 'none'}`
].join('\n');

mkdirSync(path.join(BENCH_DIR, 'results'), { recursive: true });
writeFileSync(path.join(BENCH_DIR, 'results', 'pronunciation.json'), JSON.stringify(rows, null, '\t'));
writeFileSync(path.join(BENCH_DIR, 'results', 'pronunciation.md'), `${md}\n`);
console.log(md);
