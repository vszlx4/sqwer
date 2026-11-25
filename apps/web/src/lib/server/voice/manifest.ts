/*
 * The words the Supertonic voice is made for, as sets: the lessons, then the word lists from small to large (frequency
 * order kept where a list has one). A person chooses the sets to make; each set holds every word of its list, so a
 * word shared by two chosen sets is made once and counts in both.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { COURSE_WORDS, EXAM_WORDS, WORD_LISTS, parseWordList, type WordListId } from '@sqwer/content';
import { WORD_TIERS } from '@sqwer/content/sets';
import { isSpeakable } from '#lib/voice/clip.ts';

export interface VoiceSet {
	/** 'course' or a word list id. */
	id: string;
	name: string;
	words: string[];
}

const THEMED = WORD_LISTS.filter((l) => l.group === 'Themed').map((l) => l.id);
/** Making order after the course words. */
export const SET_ORDER: readonly WordListId[] = ['english-200', 'english-1k', ...THEMED, 'english-5k', 'english-10k', 'english-25k', 'english-450k'];


/** packages/content/lists, found by walking up from a folder (the repo root holds packages/). */
export function findListsDir(from = process.cwd()): string {
	for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
		const lists = path.join(dir, 'packages', 'content', 'lists');
		if (existsSync(lists)) return lists;
		if (path.dirname(dir) === dir) throw new Error('voice: word lists not found (packages/content/lists)');
	}
}

/** Lowercase speakable words, each once, first appearance kept. */
const clean = (words: readonly string[]) => [...new Set(words.map((w) => w.trim().toLowerCase()).filter(isSpeakable))];

export function loadList(listsDir: string, id: WordListId): string[] {
	if (id === 'english-200') return clean(EXAM_WORDS);
	return clean(parseWordList(readFileSync(path.join(listsDir, `${id}.txt`), 'utf8')));
}

const NAMES: Record<string, string> = { course: 'Lessons' };
const nameOf = (id: string) => NAMES[id] ?? WORD_LISTS.find((l) => l.id === id)?.name ?? id;

/** Every set a person may choose, each with all its words, in catalog order. */
export function catalog(listsDir: string, load: (id: WordListId) => readonly string[] = (id) => loadList(listsDir, id)): VoiceSet[] {
	return [
		{ id: 'course', name: nameOf('course'), words: clean([...WORD_TIERS.flat(), ...COURSE_WORDS]) },
		...SET_ORDER.map((id) => ({ id, name: nameOf(id), words: clean(load(id)) }))
	];
}

let cached: { dir: string; sets: VoiceSet[] } | null = null;

/** The catalog, read once per process: the lists do not change while the site runs. */
export function loadCatalog(listsDir = findListsDir()): VoiceSet[] {
	if (cached?.dir !== listsDir) cached = { dir: listsDir, sets: catalog(listsDir) };
	return cached.sets;
}

/** The chosen sets, in the order chosen; unknown ids are skipped. */
export function chosenSets(all: readonly VoiceSet[], ids: readonly string[]): VoiceSet[] {
	const by = new Map(all.map((s) => [s.id, s]));
	return ids.flatMap((id) => by.get(id) ?? []);
}

export const isKnownSet = (id: string, all: readonly VoiceSet[]) => all.some((s) => s.id === id);

/** Every set in catalog order, each word in the first set that has it: every clip any set may want. */
export function buildManifest(listsDir: string, load?: (id: WordListId) => readonly string[]): VoiceSet[] {
	const seen = new Set<string>();
	return catalog(listsDir, load).map((s) => ({ ...s, words: s.words.filter((w) => !seen.has(w) && (seen.add(w), true)) }));
}
