/*
 * Per-set answer data, made by `npm run heard:data` in apps/web: sound-alike groups from the Standard voice's phonemes
 * and reviewed British spellings (Wiktionary, CC BY-SA 4.0). Loaded with the set, so the large lists stay out of the
 * first load.
 */

import type { WordListId } from '../../lists.ts';

export interface HeardData {
	/** Words the voice reads with the same phonemes. */
	sounds: string[][];
	/** [British, American] spelling pairs beyond the built-in rules. */
	variants: [string, string][];
}

export type HeardSetId = 'course' | WordListId;

const json = { with: { type: 'json' } } as const;
// JSON imports type pairs as string[]; the generator writes them as HeardData.
const FILES: Record<HeardSetId, () => Promise<{ default: unknown }>> = {
	course: () => import('./course.json', json),
	'english-200': () => import('./english-200.json', json),
	'english-1k': () => import('./english-1k.json', json),
	'english-5k': () => import('./english-5k.json', json),
	'english-10k': () => import('./english-10k.json', json),
	'english-25k': () => import('./english-25k.json', json),
	'english-450k': () => import('./english-450k.json', json),
	'double-letters': () => import('./double-letters.json', json),
	contractions: () => import('./contractions.json', json),
	shakespearean: () => import('./shakespearean.json', json),
	misspelled: () => import('./misspelled.json', json),
	legal: () => import('./legal.json', json),
	medical: () => import('./medical.json', json),
	'old-english': () => import('./old-english.json', json)
};

const cache = new Map<HeardSetId, Promise<HeardData>>();

/** A set's answer data, loaded once. */
export function loadHeardData(id: HeardSetId): Promise<HeardData> {
	let data = cache.get(id);
	if (!data) {
		data = FILES[id]().then((m) => m.default as HeardData);
		cache.set(id, data);
	}
	return data;
}
