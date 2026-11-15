import { describe, expect, it } from 'vitest';
import { batchPerformance, difficultyOf, GAIN, LOSS, migrateChoice, nextDifficulty, PAR, ratingOf, ratingStep, roundPerformance, step, TIERS, tierOf } from './levels.ts';

describe('levels', () => {
	it('name every difficulty, with Nightmare open-ended', () => {
		expect([1, 2.9, 3, 4.99, 5, 7, 9, 10.9, 11, 40].map((d) => tierOf(d).id)).toEqual([
			'easy', 'easy', 'medium', 'medium', 'hard', 'expert', 'insane', 'insane', 'nightmare', 'nightmare'
		]);
		for (const t of TIERS) expect(tierOf(t.difficulty)).toBe(t);
	});

	it('map rating to difficulty and back', () => {
		for (const d of [1, 2, 6.5, 12, 20]) expect(difficultyOf(ratingOf(d))).toBeCloseTo(d);
		expect(difficultyOf(0)).toBe(1);
		expect(difficultyOf(-50)).toBe(1);
	});

	it('take longer to climb every level than the one before, and never top out', () => {
		const climb = TIERS.slice(1).map((t) => ratingOf(t.difficulty - 1));
		const widths = climb.slice(1).map((r, i) => r - climb[i]!);
		for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeGreaterThan(widths[i - 1]!);
		// Nightmare takes dozens of perfect rounds from the start.
		expect(ratingOf(11) / GAIN).toBeGreaterThan(40);
		expect(difficultyOf(1e6)).toBeGreaterThan(difficultyOf(1e5));
	});

	it('move the rating by how well a round went', () => {
		expect(ratingStep(PAR)).toBe(0);
		expect(ratingStep(1)).toBe(GAIN);
		expect(ratingStep(0)).toBeCloseTo(-LOSS);
		expect(ratingStep(0.9)).toBeGreaterThan(ratingStep(0.8));
		expect(ratingStep(0.3)).toBeLessThan(ratingStep(0.5));
		expect(nextDifficulty(4, 1)).toBeGreaterThan(4);
		expect(nextDifficulty(4, 0.2)).toBeLessThan(4);
		expect(nextDifficulty(1, 0)).toBe(1);
	});

	it('climb fast at the start and slowly high up', () => {
		const gain = (d: number) => nextDifficulty(d, 1) - d;
		expect(gain(2)).toBeGreaterThan(gain(8));
		expect(gain(8)).toBeGreaterThan(gain(14));
		expect(gain(14)).toBeGreaterThan(0);
	});

	it('score rounds: a clear is at or above par by accuracy, a miss below', () => {
		expect(roundPerformance(true, 100)).toBe(1);
		expect(roundPerformance(true, 70)).toBe(PAR);
		expect(roundPerformance(true, 90)).toBeCloseTo(0.85);
		expect(roundPerformance(false, 100)).toBeLessThan(PAR);
		expect(roundPerformance(false, 20)).toBeLessThan(roundPerformance(false, 80));
	});

	it('score Listen batches by points, less for words that needed replays', () => {
		const first = batchPerformance(Array.from({ length: 6 }, () => ({ points: 1, plays: 1 })));
		const replayed = batchPerformance(Array.from({ length: 6 }, () => ({ points: 1, plays: 3 })));
		expect(first).toBe(1);
		expect(replayed).toBeLessThan(first);
		expect(batchPerformance([{ points: 0.5, plays: 1 }, { points: 0, plays: 1 }])).toBe(0.25);
	});

	it('group difficulty into whole steps and carry old level ids over', () => {
		expect([0.2, 1.4, 1.5, 12.6].map(step)).toEqual([1, 1, 2, 13]);
		expect(['gentle', 'steady', 'brisk', 'fast', 'expert', 'master', 'adaptive'].map(migrateChoice)).toEqual(['easy', 'medium', 'hard', 'expert', 'insane', 'nightmare', 'adaptive']);
	});
});
