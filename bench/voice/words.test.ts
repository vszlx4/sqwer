import { describe, expect, it } from 'vitest';
import { isSpeakable } from '../../apps/web/src/lib/voice/clip.ts';
import { GROUPS, WORDS } from './words.ts';

describe('voice bench word set', () => {
	it('has 200 distinct words', () => {
		expect(WORDS).toHaveLength(200);
		expect(Object.values(GROUPS).flat()).toHaveLength(200);
	});

	it('only has words the game can speak', () => {
		expect(WORDS.filter((w) => !isSpeakable(w))).toEqual([]);
	});

	it('keeps the words the old voice got wrong', () => {
		expect(GROUPS.misses).toEqual(expect.arrayContaining(['bought', 'joy', 'organ', 'main', 'since', 'thin', 'neck', 'niche']));
	});
});
