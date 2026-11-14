/*
 * Listen and type scoring, shared by lessons and endless play: each answer is graded by checkHeard (packages/content)
 * and scores its points. Exact and accepted answers score 1, close ones half; misheard and wrong score nothing.
 * Time to answer and replays are kept with the answer and shown, never scored.
 */

import { checkHeard, type HeardData, type HeardKind, type HeardResult } from '@sqwer/content';

export type Outcome = HeardKind;

/** One answered word, as rounds, runs and reviews keep it. */
export interface Answer {
	word: string;
	/** The answer, normalized. */
	typed: string;
	outcome: Outcome;
	points: number;
	/** Endless level the word came from; 0 in lessons. */
	level: number;
	/** Times the word was played, the first time included. */
	plays: number;
	/** Milliseconds from the word's first play to the answer. */
	ms: number;
}

/** Full credit: the word, or another way to write the same sound. */
export const isRight = (o: Outcome) => o === 'exact' || o === 'accepted';

export interface GradeOptions {
	data?: HeardData;
	isWord?: (word: string) => boolean;
}

/** Grades an answer for a word. */
export function grade(word: string, typed: string, options: GradeOptions = {}): HeardResult {
	return checkHeard(word, typed, options);
}

/** Points of a set of answers, rounded to the half point. */
export const pointsOf = (answers: readonly Pick<Answer, 'points'>[]) => Math.round(answers.reduce((n, a) => n + a.points, 0) * 2) / 2;

/** Whether a set of answers reached its goal in points. */
export const passed = (answers: readonly Pick<Answer, 'points'>[], target: number) => pointsOf(answers) >= target;

/** Share of the possible points, as a whole percentage; what lesson stars read. */
export const accuracyOf = (answers: readonly Pick<Answer, 'points'>[]) => (answers.length ? Math.round((pointsOf(answers) / answers.length) * 100) : 0);
