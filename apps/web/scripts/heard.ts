// Data for checking Listen and type answers, one file per set in packages/content/src/heard/data:
//
//   npm run heard:data            sound-alike groups and British spellings for the lessons and every word list
//
// Sound-alikes: words the Standard voice (Kokoro) reads with the same espeak-ng phonemes, so "sounds the same" means
// the same in the clip played. Each set's groups take members from the set and English 10k, keeping only words the
// dictionary knows as plain, current English (no names, abbreviations, old or dialect forms, misspellings).
// British spellings: "<region> standard spelling of <word>" senses from dictionary.db (Wiktionary, CC BY-SA 4.0) at
// the repo root, the same tags left out and reviewed through DENY below. Without dictionary.db, other members come
// from English 10k unchecked and the British spellings already in the files are kept.
// Phonemes are cached in .data/heard-ipa.json; a run without the cache takes about ten minutes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setPriority } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { WORD_LISTS, americanSpelling, type HeardData } from '@sqwer/content';
import { buildManifest, findListsDir, loadList } from '../src/lib/server/voice/manifest.ts';
import { DATA_DIR } from '../src/lib/server/config.ts';

setPriority(19);

const listsDir = findListsDir();
const root = path.resolve(listsDir, '../../..');
const outDir = path.join(listsDir, '../src/heard/data');
const cacheFile = path.join(DATA_DIR, 'heard-ipa.json');

/** Pairs read wrongly as British/American: names, dialect words and two different words. */
const DENY = new Set(['dependant', 'bryan', 'jorja', 'donaher', 'gunge', 'birk', 'burr', 'oi', 'welsher', 'matt', 'acyclovir', 'envigorate']);

const sets = [
	{ id: 'course', words: buildManifest(listsDir)[0]!.words },
	...WORD_LISTS.map((l) => ({ id: l.id, words: loadList(listsDir, l.id) }))
];
const common = new Set(loadList(listsDir, 'english-10k'));

const dbFile = path.join(root, 'dictionary.db');
const db = existsSync(dbFile) ? new DatabaseSync(dbFile, { readOnly: true }) : null;

/** Sense tags that mark a word or spelling as not plain, current English. */
const OFF = /"(abbreviation|initialism|acronym|clipping|obsolete|archaic|dialectal|misspelling|nonstandard|rare|pronunciation-spelling|eye-dialect|slang|informal)"/;

const senses = db?.prepare(
	`select w.word display, e.pos pos, s.tags tags from words w join entries e on e.word_id = w.id join senses s on s.entry_id = e.id
	 where w.word_norm = ? and e.lang_code = 'en'`
);
const plainCache = new Map<string, boolean>();

/** A lowercase dictionary word with at least one sense that is not a name and carries none of OFF. */
function plain(word: string): boolean {
	if (!senses) return true;
	let ok = plainCache.get(word);
	if (ok === undefined) {
		const rows = senses.all(word) as { display: string; pos: string; tags: string }[];
		ok = rows.some((r) => r.display === word && r.pos !== 'name' && !OFF.test(r.tags));
		plainCache.set(word, ok);
	}
	return ok;
}

/* Phonemes, cached and saved as they go so a stopped run resumes. */
const ipa: Record<string, string> = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
const todo = [...new Set(sets.flatMap((s) => s.words))].filter((w) => !(w in ipa));
if (todo.length) {
	const { phonemize } = await import('phonemizer');
	mkdirSync(path.dirname(cacheFile), { recursive: true });
	const started = Date.now();
	for (let i = 0; i < todo.length; i++) {
		ipa[todo[i]!] = (await phonemize(todo[i]!, 'en-us')).join(' ').trim();
		if ((i + 1) % 20000 === 0 || i === todo.length - 1) {
			writeFileSync(cacheFile, JSON.stringify(ipa));
			const left = ((Date.now() - started) / (i + 1)) * (todo.length - i - 1);
			console.log(`  ${(i + 1).toLocaleString('en-US')} of ${todo.length.toLocaleString('en-US')} phonemized, about ${Math.ceil(left / 60000)} min left`);
		}
	}
}

/* British → American pairs from the dictionary. */
function dictionaryPairs(): Map<string, string> | null {
	if (!db) return null;
	const rows = db
		.prepare(
			`select w.word_norm w, s.glosses g, s.tags t from senses s join entries e on e.id = s.entry_id join words w on w.id = e.word_id
			 where e.lang_code = 'en' and s.glosses like '%spelling of %'`
		)
		.all() as { w: string; g: string; t: string }[];
	const region = /\b(British|Commonwealth|UK|Ireland|Irish|Canada|Canadian|Australia|Australian|New Zealand|South Africa)\b/;
	const gloss = /^([A-Za-z ,()-]*?)\s*(?:standard |alternative |non-Oxford )*spelling of ([a-z]+)\.?$/i;
	const pairs = new Map<string, string>();
	for (const r of rows) {
		if (!/^[a-z]+$/.test(r.w) || DENY.has(r.w) || OFF.test(r.t)) continue;
		for (const g of JSON.parse(r.g) as string[]) {
			const m = g.match(gloss);
			if (!m) continue;
			const pre = m[1] ?? '';
			if (/Oxford/.test(pre) && !/Non-Oxford/i.test(pre)) continue;
			if (!(region.test(pre) || (!pre.trim() && /"(UK|British|Commonwealth)"/.test(r.t)))) continue;
			const us = m[2]!.toLowerCase();
			if (us === r.w || DENY.has(us) || distance(r.w, us) > 3) continue;
			// Oxford -ize read the wrong way round.
			if (/iz/.test(r.w) && /is/.test(us)) continue;
			pairs.set(r.w, us);
		}
	}
	// No chains or cycles, and nothing the built-in rules already say.
	for (const [uk, us] of pairs) if (pairs.has(us) || americanSpelling(uk) !== uk || americanSpelling(us) !== us) pairs.delete(uk);
	return pairs;
}

function distance(a: string, b: string): number {
	const row = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		let prev = row[0]!;
		row[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const t = row[j]!;
			row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
			prev = t;
		}
	}
	return row[b.length]!;
}

const pairs = dictionaryPairs();
if (!pairs) console.log('  dictionary.db not found: British spellings kept as they are');

mkdirSync(outDir, { recursive: true });
for (const set of sets) {
	const own = new Set(set.words);
	const byIpa = new Map<string, string[]>();
	for (const w of new Set([...own, ...common])) {
		if (!plain(w)) continue;
		const p = ipa[w];
		if (!p) continue;
		byIpa.set(p, [...(byIpa.get(p) ?? []), w]);
	}
	const sounds = [...byIpa.values()]
		.filter((g) => g.length > 1 && g.some((w) => own.has(w)) && new Set(g.map((w) => americanSpelling(w))).size > 1)
		.map((g) => g.sort())
		.sort((a, b) => a[0]!.localeCompare(b[0]!));
	const file = path.join(outDir, `${set.id}.json`);
	const kept: HeardData = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { sounds: [], variants: [] };
	const variants = pairs
		? [...pairs].filter(([uk, us]) => own.has(uk) || own.has(us)).sort((a, b) => a[0].localeCompare(b[0]))
		: kept.variants;
	const data: HeardData = { sounds, variants };
	writeFileSync(file, `${JSON.stringify(data)}\n`);
	console.log(`  ${set.id}: ${sounds.length} sound-alike groups, ${variants.length} British spellings`);
}
db?.close();
