import { describe, expect, it } from 'vitest';
import { batchLevel, summarize, type Answer } from './run.ts';

const seq = (...values: number[]) => {
	let i = 0;
	return () => values[i++ % values.length];
};

describe('batchLevel', () => {
	const batch = (...p: number[]) => p.map((points) => ({ points, plays: 1 }));
	it('climbs after a strong batch, more the stronger, and eases after a weak one', () => {
		const all = batchLevel(3, batch(1, 1, 1, 1, 1, 1), true);
		const most = batchLevel(3, batch(1, 1, 1, 1, 1, 0), true);
		expect(all).toBeGreaterThan(most);
		expect(most).toBeGreaterThan(3);
		expect(batchLevel(3, batch(1, 1, 1, 0, 0, 0), true)).toBeLessThan(3);
	});

	it('keeps a fixed level, goes past Nightmare and never under the start', () => {
		expect(batchLevel(6, batch(0, 0, 0, 0, 0, 0), false)).toBe(6);
		expect(batchLevel(12, batch(1, 1, 1, 1, 1, 1), true)).toBeGreaterThan(12);
		expect(batchLevel(1, batch(0, 0, 0, 0, 0, 0), true)).toBe(1);
	});
});

describe('summarize', () => {
	const POINTS = { exact: 1, accepted: 1, close: 0.5, misheard: 0, wrong: 0 };
	const a = (outcome: Answer['outcome'], level = 3, plays = 1): Answer => ({ word: 'word', typed: outcome === 'exact' ? 'word' : 'wrod', outcome, points: POINTS[outcome], level, plays, ms: 2000 });
	it('counts streaks, score, accuracy and misses', () => {
		const s = summarize([a('exact', 3), a('accepted', 4, 2), a('wrong', 4, 3), a('exact', 5), a('exact', 5)]);
		expect(s).toMatchObject({ words: 5, exact: 3, accepted: 1, missed: 1, accuracy: 80, streak: 2, bestStreak: 2, score: 17, topLevel: 5, plays: 1.6 });
		expect(s.misses).toEqual([{ word: 'word', typed: 'wrod', outcome: 'wrong' }]);
	});
	it('scores close answers at half a point and lists them to practice', () => {
		const s = summarize([a('exact', 4), a('close', 4), a('misheard', 4)]);
		expect(s).toMatchObject({ points: 1.5, accuracy: 50, close: 1, missed: 1, score: 6, streak: 0, bestStreak: 1 });
		expect(s.misses.map((m) => m.outcome)).toEqual(['close', 'misheard']);
	});
	it('is all zero before the first answer', () => {
		expect(summarize([])).toMatchObject({ words: 0, accuracy: 0, plays: 0, bestStreak: 0 });
	});
});
