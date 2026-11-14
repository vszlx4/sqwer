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

// No `with { type: 'json' }`: Vite dev serves JSON as a JS module and the browser rejects it under a JSON type.
// Only Vite (dev, build, Vitest) loads these. JSON imports type pairs as string[]; the generator writes them as HeardData.
const FILES: Record<HeardSetId, () => Promise<{ default: unknown }>> = {
	course: () => import('./course.json'),
	'english-200': () => import('./english-200.json'),
	'english-1k': () => import('./english-1k.json'),
	'english-5k': () => import('./english-5k.json'),
	'english-10k': () => import('./english-10k.json'),
	'english-25k': () => import('./english-25k.json'),
	'english-450k': () => import('./english-450k.json'),
	'double-letters': () => import('./double-letters.json'),
	contractions: () => import('./contractions.json'),
	shakespearean: () => import('./shakespearean.json'),
	misspelled: () => import('./misspelled.json'),
	legal: () => import('./legal.json'),
	medical: () => import('./medical.json'),
	'old-english': () => import('./old-english.json')
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
