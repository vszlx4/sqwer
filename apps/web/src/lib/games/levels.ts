import type { IconName } from '#lib/ui/Icon.svelte';

/*
 * Endless difficulty, shown by name and icon, never a number. Six fixed levels to pick from, and an adaptive rating
 * with no cap. The rating moves by how well each round went; difficulty grows with the log of the rating, so every
 * level takes longer to climb than the one before and Nightmare keeps getting harder. Games read their settings from
 * the difficulty: 1 and up, where the fixed levels sit at 2, 4 … 12 (the old twelve levels' scale).
 */

export const TIERS = [
	{ id: 'easy', name: 'Easy', icon: 'sprout', difficulty: 2, note: 'Short, very common words and a relaxed pace.' },
	{ id: 'medium', name: 'Medium', icon: 'leaf', difficulty: 4, note: 'Everyday words at a comfortable speed.' },
	{ id: 'hard', name: 'Hard', icon: 'flame', difficulty: 6, note: 'Longer everyday words and a quicker pace.' },
	{ id: 'expert', name: 'Expert', icon: 'bolt', difficulty: 8, note: 'Less common words and a fast pace.' },
	{ id: 'insane', name: 'Insane', icon: 'demon', difficulty: 10, note: 'Long, less frequent words at full speed.' },
	{ id: 'nightmare', name: 'Nightmare', icon: 'skull', difficulty: 12, note: 'Rare and technical words from the full dictionary, which includes mature words, at top speed.' }
] as const satisfies readonly { id: string; name: string; icon: IconName; difficulty: number; note: string }[];

export type TierId = (typeof TIERS)[number]['id'];
export type Tier = (typeof TIERS)[number];

export const tierById = (id: string): Tier | null => TIERS.find((t) => t.id === id) ?? null;

/** The level a difficulty falls in: each fixed level owns the band one either side of its own difficulty. */
export function tierOf(difficulty: number): Tier {
	return TIERS.findLast((t) => difficulty >= t.difficulty - 1) ?? TIERS[0];
}

/** Difficulty at rating 0. */
export const START = 1;
/** Rating at which the curve has risen by SPREAD·ln 2; sets how fast the first levels go by. */
const SCALE = 100;
/** Difficulty gained per e-fold of the rating. */
const SPREAD = 3;

/** Difficulty for an adaptive rating: 1 at 0, Medium from about 95, Nightmare from about 2,700, and on without a cap. */
export const difficultyOf = (rating: number) => START + SPREAD * Math.log1p(Math.max(0, rating) / SCALE);

/** The rating a difficulty sits at; the inverse of difficultyOf. */
export const ratingOf = (difficulty: number) => SCALE * Math.expm1((Math.max(START, difficulty) - START) / SPREAD);

/** Performance (0 to 1) that holds the rating where it is. */
export const PAR = 0.7;
/** Rating a perfect round adds, and a round with nothing right takes away. */
export const GAIN = 60;
export const LOSS = 60;

/** Rating change for a round played at `performance`, 0 to 1: up above par, down below it, in proportion. */
export function ratingStep(performance: number): number {
	const p = Math.min(1, Math.max(0, performance));
	return p >= PAR ? (GAIN * (p - PAR)) / (1 - PAR) : (-LOSS * (PAR - p)) / PAR;
}

/** The adaptive difficulty after a round played at `performance`. */
export const nextDifficulty = (difficulty: number, performance: number) => difficultyOf(Math.max(0, ratingOf(difficulty) + ratingStep(performance)));

/**
 * Performance of a round-based game: a cleared round lands between par and perfect by its accuracy (80% and up),
 * a missed one below par, lower the less of it went right.
 */
export function roundPerformance(passed: boolean, accuracy: number): number {
	const a = Math.min(1, Math.max(0, accuracy / 100));
	return passed ? PAR + (1 - PAR) * Math.min(1, Math.max(0, (a - 0.8) / 0.2)) : a * (PAR - 0.2);
}

/** Share of a play's value left after replays: the first play is worth all of it. */
const PLAY_VALUE = [1, 1, 0.9, 0.8];

/** Performance of a Listen and type batch: points per word, less for words that needed replays. */
export function batchPerformance(batch: readonly { points: number; plays: number }[]): number {
	if (!batch.length) return PAR;
	const sum = batch.reduce((s, a) => s + a.points * (PLAY_VALUE[Math.min(a.plays, PLAY_VALUE.length - 1)] ?? 1), 0);
	return sum / batch.length;
}

/** Word pools and score steps go by whole difficulty steps. */
export const step = (difficulty: number) => Math.max(START, Math.round(difficulty));

/** Fixed levels before the rename, by their old ids. */
const OLD_IDS: Record<string, TierId> = { gentle: 'easy', steady: 'medium', brisk: 'hard', fast: 'expert', expert: 'insane', master: 'nightmare' };

/** A saved choice from before the rename: old ids map to the level at the same difficulty. */
export const migrateChoice = (id: string): TierId | 'adaptive' => (id === 'adaptive' ? 'adaptive' : (OLD_IDS[id] ?? 'easy'));

/** How far a difficulty is through its level, 0 to 1; Nightmare has no end, so it shows full. */
export function tierProgress(difficulty: number): number {
	const t = tierOf(difficulty);
	if (t.id === 'nightmare') return 1;
	const from = t.id === 'easy' ? START : t.difficulty - 1;
	return Math.min(1, Math.max(0, (difficulty - from) / (t.difficulty + 1 - from)));
}

/** Which way a difficulty change crossed into another level, if it did. */
export function levelChange(from: number, to: number): 'up' | 'down' | null {
	const a = TIERS.indexOf(tierOf(from));
	const b = TIERS.indexOf(tierOf(to));
	return b > a ? 'up' : b < a ? 'down' : null;
}
