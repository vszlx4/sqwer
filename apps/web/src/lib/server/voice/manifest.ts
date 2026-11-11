/*
 * The words the Supertonic voice is made for, as sets in the order they are made: what the lessons use first, then
 * the word lists from small to large (frequency order kept where a list has one). A word belongs to the first set
 * that has it, so no word is made twice.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { COURSE_WORDS, EXAM_WORDS, WORD_LISTS, parseWordList, type WordListId } from '@sqwer/content';
import { WORD_TIERS } from '@sqwer/content/sets';
import { isSpeakable } from '#lib/courses/voice/clip.ts';

export interface VoiceSet {
	id: 'course' | WordListId;
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

/** Lowercase speakable words, first appearance kept. */
const clean = (words: readonly string[]) => words.map((w) => w.trim().toLowerCase()).filter(isSpeakable);

export function loadList(listsDir: string, id: WordListId): string[] {
	if (id === 'english-200') return clean(EXAM_WORDS);
	return clean(parseWordList(readFileSync(path.join(listsDir, `${id}.txt`), 'utf8')));
}

/** All sets in making order; each word in one set only. */
export function buildManifest(listsDir: string, load: (id: WordListId) => readonly string[] = (id) => loadList(listsDir, id)): VoiceSet[] {
	const seen = new Set<string>();
	const take = (words: readonly string[]) => words.filter((w) => !seen.has(w) && (seen.add(w), true));
	const sets: VoiceSet[] = [{ id: 'course', name: 'Lessons', words: take(clean([...WORD_TIERS.flat(), ...COURSE_WORDS])) }];
	for (const id of SET_ORDER) sets.push({ id, name: WORD_LISTS.find((l) => l.id === id)?.name ?? id, words: take(clean(load(id))) });
	return sets;
}
