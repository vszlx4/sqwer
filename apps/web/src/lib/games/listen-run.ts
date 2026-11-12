/*
 * Listen and type in endless mode: one word after another until the player stops. Answers are judged in hidden
 * batches of six, and a batch moves the adaptive level the way a round does in the other games.
 */

import { isSpeakable } from '#lib/courses/voice/clip.ts';
import { nextLevel, roundSettings } from './endless.ts';

/** Answers per hidden batch. */
export const BATCH = 6;
/** Words fetched ahead of the one in play, so each plays without a wait. */
export const LOOKAHEAD = 3;
/** Words not repeated until this many others have played. */
const RECENT = 60;

export type Outcome = 'exact' | 'accepted' | 'wrong';

export interface Answer {
	word: string;
	typed: string;
	outcome: Outcome;
	level: number;
	/** Times the word was played, the first time included. */
	plays: number;
}

/** The level after a batch: up when enough words were right, down when not; fixed difficulty keeps it. */
export function batchLevel(level: number, batch: readonly Outcome[], adaptive: boolean): number {
	if (!adaptive) return level;
	const right = batch.filter((o) => o !== 'wrong').length;
	return nextLevel(level, right >= roundSettings('listen', level).target!);
}

/** `n` words from the pool, none played recently while others remain. */
export function pickWords(pool: readonly string[], recent: readonly string[], n: number, rand: () => number): string[] {
	const usable = pool.filter(isSpeakable);
	const skip = new Set(recent.slice(-RECENT));
	const fresh = usable.filter((w) => !skip.has(w));
	const from = fresh.length >= n ? fresh : usable;
	const out: string[] = [];
	const taken = new Set<string>();
	for (let tries = 0; out.length < n && tries < n * 20 && from.length; tries++) {
		const w = from[Math.floor(rand() * from.length)];
		if (taken.has(w) && taken.size < from.length) continue;
		taken.add(w);
		out.push(w);
	}
	return out;
}

export interface RunStats {
	words: number;
	exact: number;
	accepted: number;
	missed: number;
	/** Right answers, exact or accepted, as a whole percentage. */
	accuracy: number;
	streak: number;
	bestStreak: number;
	/** Each right word scores its level. */
	score: number;
	topLevel: number;
	/** Plays per word on average, the first one included. */
	plays: number;
	misses: { word: string; typed: string }[];
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
		if (a.outcome === 'wrong') streak = 0;
		else {
			streak++;
			score += a.level;
			bestStreak = Math.max(bestStreak, streak);
		}
	}
	const exact = answers.filter((a) => a.outcome === 'exact').length;
	const accepted = answers.filter((a) => a.outcome === 'accepted').length;
	const words = answers.length;
	return {
		words,
		exact,
		accepted,
		missed: words - exact - accepted,
		accuracy: words ? Math.round(((exact + accepted) / words) * 100) : 0,
		streak,
		bestStreak,
		score,
		topLevel,
		plays: words ? Math.round((plays / words) * 10) / 10 : 0,
		misses: answers.filter((a) => a.outcome === 'wrong').map(({ word, typed }) => ({ word, typed }))
	};
}
