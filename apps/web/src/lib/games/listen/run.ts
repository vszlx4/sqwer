/*
 * Listen and type in endless mode: one word after another until the player stops. Answers are judged in hidden
 * batches of six by points (score.ts), and a batch moves the adaptive level the way a round does in the other games.
 */

import { nextLevel, roundSettings } from '../endless.ts';
import { isRight, pointsOf, type Answer } from './score.ts';

export type { Answer, Outcome } from './score.ts';

/** Answers per hidden batch. */
export const BATCH = 6;
/** Words fetched ahead of the one in play, so each plays without a wait. */
export const LOOKAHEAD = 3;
/** The level after a batch: up when it scored enough points, down when not; fixed difficulty keeps it. */
export function batchLevel(level: number, batch: readonly Pick<Answer, 'points'>[], adaptive: boolean): number {
	if (!adaptive) return level;
	return nextLevel(level, pointsOf(batch) >= roundSettings('listen', level).target!);
}

export interface RunStats {
	words: number;
	exact: number;
	accepted: number;
	missed: number;
	close: number;
	/** Points as a share of the words, as a whole percentage. */
	accuracy: number;
	points: number;
	streak: number;
	bestStreak: number;
	/** Each word scores its level times its points. */
	score: number;
	topLevel: number;
	/** Plays per word on average, the first one included. */
	plays: number;
	/** Words that scored less than a full point. */
	misses: { word: string; typed: string; outcome: Answer['outcome'] }[];
}

export function summarize(answers: readonly Answer[]): RunStats {
	let streak = 0;
	let bestStreak = 0;
	let score = 0;
	let topLevel = 0;
	let plays = 0;
	for (const a of answers) {
		plays += a.plays;
		topLevel = Math.max(topLevel, a.level);
		score += a.level * a.points;
		if (!isRight(a.outcome)) streak = 0;
		else {
			streak++;
			bestStreak = Math.max(bestStreak, streak);
		}
	}
	const exact = answers.filter((a) => a.outcome === 'exact').length;
	const accepted = answers.filter((a) => a.outcome === 'accepted').length;
	const close = answers.filter((a) => a.outcome === 'close').length;
	const words = answers.length;
	const points = pointsOf(answers);
	return {
		words,
		exact,
		accepted,
		close,
		missed: words - exact - accepted - close,
		accuracy: words ? Math.round((points / words) * 100) : 0,
		points,
		streak,
		bestStreak,
		score: Math.round(score),
		topLevel,
		plays: words ? Math.round((plays / words) * 10) / 10 : 0,
		misses: answers.filter((a) => a.points < 1).map(({ word, typed, outcome }) => ({ word, typed, outcome }))
	};
}
