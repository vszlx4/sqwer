import { describe, expect, it } from 'vitest';
import { batchLevel, pickWords, summarize, type Answer } from './listen-run.ts';

const seq = (...values: number[]) => {
	let i = 0;
	return () => values[i++ % values.length];
};

describe('batchLevel', () => {
	it('rises after a good batch and eases after a weak one', () => {
		expect(batchLevel(3, ['exact', 'exact', 'accepted', 'exact', 'wrong', 'wrong'], true)).toBe(4);
		expect(batchLevel(3, ['exact', 'exact', 'exact', 'wrong', 'wrong', 'wrong'], true)).toBe(2);
		// Above level 4 five of six are needed.
		expect(batchLevel(6, ['exact', 'exact', 'exact', 'exact', 'wrong', 'wrong'], true)).toBe(5);
	});
	it('keeps a fixed level and stays within 1 to 12', () => {
		expect(batchLevel(6, ['wrong', 'wrong', 'wrong', 'wrong', 'wrong', 'wrong'], false)).toBe(6);
		expect(batchLevel(12, Array(6).fill('exact'), true)).toBe(12);
		expect(batchLevel(1, Array(6).fill('wrong'), true)).toBe(1);
	});
});

describe('pickWords', () => {
	it('skips recent and unspeakable words while others remain', () => {
		const out = pickWords(['apple', 'berry', 'Cherry', 'grape'], ['apple'], 2, seq(0, 0.4, 0.9));
		expect(out).toHaveLength(2);
		expect(out).not.toContain('apple');
		expect(out).not.toContain('Cherry');
		expect(new Set(out).size).toBe(2);
	});
	it('falls back to the whole pool when everything was played', () => {
		expect(pickWords(['apple'], ['apple'], 1, seq(0))).toEqual(['apple']);
		expect(pickWords([], [], 3, seq(0))).toEqual([]);
	});
});

describe('summarize', () => {
	const a = (outcome: Answer['outcome'], level = 3, plays = 1): Answer => ({ word: 'word', typed: outcome === 'wrong' ? 'wrod' : 'word', outcome, level, plays });
	it('counts streaks, score, accuracy and misses', () => {
		const s = summarize([a('exact', 3), a('accepted', 4, 2), a('wrong', 4, 3), a('exact', 5), a('exact', 5)]);
		expect(s).toMatchObject({ words: 5, exact: 3, accepted: 1, missed: 1, accuracy: 80, streak: 2, bestStreak: 2, score: 17, topLevel: 5, plays: 1.6 });
		expect(s.misses).toEqual([{ word: 'word', typed: 'wrod' }]);
	});
	it('is all zero before the first answer', () => {
		expect(summarize([])).toMatchObject({ words: 0, accuracy: 0, plays: 0, bestStreak: 0 });
	});
});
