/*
 * Checking a word typed from speech. By ear, sound-alike words (their / there) and British spellings (colour) are the
 * same word, so both count. A slip of the finger or a spelling that reads the same is close (half a point); another
 * real word is misheard and scores nothing.
 */

import type { KeyboardLayout } from '@sqwer/layouts';
import { compareLetters, type Letter } from './compare.ts';
import type { HeardData } from './data/index.ts';
import { slipOf, type Slip } from './keys.ts';
import { soundKey } from './phonetic.ts';
import { soundsAlike } from './sounds.ts';
import { americanSpelling, britishSpelling, normalizeAnswer } from './spelling.ts';

export { compareLetters, editDistance, type Letter, type LetterMark } from './compare.ts';
export { loadHeardData, type HeardData, type HeardSetId } from './data/index.ts';
export { neighbors, type Slip } from './keys.ts';
export { soundKey } from './phonetic.ts';
export { soundsAlike } from './sounds.ts';
export { americanSpelling, britishSpelling, normalizeAnswer } from './spelling.ts';

export type HeardKind = 'exact' | 'accepted' | 'close' | 'misheard' | 'wrong';
/** Why an answer that differs still counts: another spelling, a sound-alike word, or only ' - or a space differ. */
export type Accepted = 'spelling' | 'sound' | 'written';
export type Mistake = Slip | 'sounds-right';

export interface HeardResult {
	kind: HeardKind;
	/** 1 for exact or accepted, 0.5 for close, 0 otherwise. */
	points: number;
	/** The word as it is written (capitals kept: January). */
	word: string;
	/** The answer, normalized. */
	typed: string;
	/** Answer over word, letter by letter, capitals ignored. */
	letters: Letter[];
	accepted?: Accepted;
	mistake?: Mistake;
	/** Both spellings when the word has a British one: American color · British colour. */
	spellings?: { american: string; british: string };
}

export interface HeardOptions {
	/** The set's sound-alike groups and British spellings (loadHeardData). */
	data?: HeardData;
	/** Whether an answer is a real word, for misheard; usually the set's words. */
	isWord?: (word: string) => boolean;
	/** Layout for neighboring-key slips; QWERTY by default. */
	layout?: KeyboardLayout;
}

/** Words of five letters or more may be one slip away; shorter ones must be exact. */
export const CLOSE_FROM = 5;

const POINTS: Record<HeardKind, number> = { exact: 1, accepted: 1, close: 0.5, misheard: 0, wrong: 0 };
/** Slips only a keyboard makes, named even when the result reads the same. */
const FINGER: ReadonlySet<Slip> = new Set(['neighbor', 'swap', 'double']);
const bare = (w: string) => w.replace(/['\-\s.]/g, '');
/** Edits in a comparison; a swapped pair is one. */
const edits = (letters: readonly Letter[]) => letters.reduce((n, l) => n + (l.mark === 'right' ? 0 : l.mark === 'swapped' ? 0.5 : 1), 0);

/** Grades `answer` typed from hearing `target`. */
export function checkHeard(target: string, answer: string, options: HeardOptions = {}): HeardResult {
	const { data, isWord, layout } = options;
	const word = target.trim();
	const t = normalizeAnswer(target);
	const a = normalizeAnswer(answer);
	const letters = compareLetters(a, t);
	const british = britishSpelling(t, data);
	const spellings = british ? { spellings: { american: americanSpelling(t, data), british } } : {};
	const result = (kind: HeardKind, extra: Partial<HeardResult> = {}): HeardResult => ({ kind, points: POINTS[kind], word, typed: a, letters, ...spellings, ...extra });

	if (!a) return result('wrong');
	if (a === t) return result('exact');
	if (bare(a) === bare(t)) return result('accepted', { accepted: 'written' });
	if (americanSpelling(a, data) === americanSpelling(t, data)) return result('accepted', { accepted: 'spelling' });
	if (soundsAlike(a, t, data)) return result('accepted', { accepted: 'sound' });
	if (isWord?.(a) || isWord?.(americanSpelling(a, data))) return result('misheard');

	// A keyboard slip keeps its name; otherwise a spelling that reads the same says more (sircle, elephent).
	const slip = bare(t).length >= CLOSE_FROM && edits(letters) === 1 ? slipOf(letters, layout) : null;
	if (slip && FINGER.has(slip)) return result('close', { mistake: slip });
	if (soundKey(a) === soundKey(t)) return result('close', { mistake: 'sounds-right' });
	if (slip) return result('close', { mistake: slip });
	return result('wrong');
}

export type HeardMatch = { ok: true; how: 'exact' | 'spelling' | 'sound' } | { ok: false };

/** Pass or fail only, as the screens read it until they show graded results (#177); "dont" still fails here. */
export function matchHeard(target: string, answer: string): HeardMatch {
	const r = checkHeard(target, answer);
	if (r.kind === 'exact') return { ok: true, how: 'exact' };
	if (r.kind === 'accepted' && r.accepted !== 'written') return { ok: true, how: r.accepted === 'sound' ? 'sound' : 'spelling' };
	return { ok: false };
}
