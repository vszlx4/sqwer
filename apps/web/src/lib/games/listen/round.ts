/*
 * A Listen and type round as plain state, so screens only render it: intro → listening → answered → (next word |
 * review) → done. Lessons play a fixed list and pass by points; a practice round of missed words is ungraded.
 * Replays are unlimited in lessons and at endless levels 1-4, then three per word (5-8) and one (9-12); from level 5
 * the slow clip counts as a replay.
 */

import { accuracyOf, passed, pointsOf, type Answer } from './score.ts';

export type Phase = 'intro' | 'listening' | 'answered' | 'review' | 'done';

export interface Round {
	words: readonly string[];
	/** Points needed to pass; 0 for a practice round. */
	target: number;
	index: number;
	phase: Phase;
	answers: Answer[];
	/** Replays of the current word, the first play not counted. */
	replays: number;
}

export const newRound = (words: readonly string[], target: number): Round => ({ words: [...words], target, index: 0, phase: 'intro', answers: [], replays: 0 });

export const start = (r: Round): Round => (r.phase === 'intro' ? { ...r, phase: 'listening', replays: 0 } : r);

/** Records the answer to the current word. */
export function answer(r: Round, a: Answer): Round {
	if (r.phase !== 'listening') return r;
	const answers = [...r.answers];
	answers[r.index] = a;
	return { ...r, answers, phase: 'answered' };
}

/** After an answer: the next word, or the review once every word is answered. */
export function next(r: Round): Round {
	if (r.phase !== 'answered') return r;
	if (r.index + 1 < r.words.length) return { ...r, index: r.index + 1, phase: 'listening', replays: 0 };
	return { ...r, phase: 'review' };
}

export const finish = (r: Round): Round => (r.phase === 'review' ? { ...r, phase: 'done' } : r);

/** Swaps a word not yet answered (its clip is missing) for another. */
export function swap(r: Round, i: number, word: string): Round {
	if (i < r.index || (i === r.index && r.phase !== 'listening' && r.phase !== 'intro')) return r;
	const words = [...r.words];
	words[i] = word;
	return { ...r, words };
}

export interface RoundResult {
	passed: boolean;
	points: number;
	/** Share of the possible points: what lesson stars read. */
	accuracy: number;
	summary: string;
	missed: string[];
}

export function result(r: Round): RoundResult {
	const points = pointsOf(r.answers);
	const total = r.words.length;
	const goal = r.target ? ` Goal: ${r.target}.` : '';
	return {
		passed: r.target === 0 || passed(r.answers, r.target),
		points,
		accuracy: accuracyOf(r.answers),
		summary: `${points} of ${total} points.${goal}`,
		missed: r.answers.filter((a) => a.points < 1).map((a) => a.word)
	};
}

/* ---------------------------------------------------------------- replays */

export type Speed = 'normal' | 'slow';

/** Replays allowed per word: lessons (level null) and levels 1-4 unlimited, 5-8 three, 9-12 one. */
export function replayLimit(level: number | null): number {
	if (level === null || level <= 4) return Infinity;
	return level <= 8 ? 3 : 1;
}

/** Whether a slow play counts against the replays (from level 5). */
export const slowCounts = (level: number | null) => level !== null && level >= 5;

/** Whether the word may be played again at this speed. The first play of a word is free. */
export function canReplay(level: number | null, replays: number, speed: Speed): boolean {
	if (speed === 'slow' && !slowCounts(level)) return true;
	return replays < replayLimit(level);
}

/** A play of the word: counts as a replay unless it is the first, or a slow play that does not count. */
export const countsAsReplay = (level: number | null, first: boolean, speed: Speed) => !first && (speed === 'normal' || slowCounts(level));
