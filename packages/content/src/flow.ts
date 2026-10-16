import { FREQUENT_WORDS } from './frequency.ts';

/*
 * Flow words: very common words that are quick to type in a burst on a QWERTY keyboard.
 * Each word is scored on what research on typing speed finds matters:
 *
 * - Hand alternation: successive keys on opposite hands are typed faster than two keys on one
 *   hand, because the next key can be prepared while the other hand strikes (Gentner, 1983;
 *   Cerni and Job, 2016). This carries the most weight.
 * - Same-finger pairs: two different keys with one finger are the slowest transitions.
 * - Reach: keys on the home row are quickest; top and bottom rows cost more, the centre column
 *   (T, G, B, Y, H, N) and the little-finger corners more still.
 * - Row jumps: going from the top row to the bottom row on one hand is awkward.
 * - Frequency: more frequent words are preferred, so the list stays everyday English.
 */

type Hand = 'L' | 'R';
interface Key {
	hand: Hand;
	/** Finger number 1 (index) to 4 (little finger). */
	finger: number;
	/** -1 bottom row, 0 home row, 1 top row. */
	row: number;
	/** Extra reach beyond the row: the centre column and the little-finger corners. */
	stretch: number;
}

const LAYOUT: Record<string, Key> = {};
const rows: [string, number][] = [
	['qwertyuiop', 1],
	['asdfghjkl', 0],
	['zxcvbnm', -1]
];
for (const [letters, row] of rows) {
	[...letters].forEach((c, i) => {
		const hand: Hand = i <= 4 ? 'L' : 'R';
		// Columns: 0-3 little..index on the left, 4 the left centre column; mirrored on the right.
		const col = hand === 'L' ? i : i - 5;
		const finger = hand === 'L' ? [4, 3, 2, 1, 1][col]! : [1, 1, 2, 3, 4][col]!;
		const centre = (hand === 'L' && col === 4) || (hand === 'R' && col === 0);
		const corner = finger === 4 && row !== 0;
		LAYOUT[c] = { hand, finger, row, stretch: (centre ? 0.5 : 0) + (corner ? 0.5 : 0) };
	});
}

export interface FlowScore {
	word: string;
	rank: number;
	/** Share of transitions that change hand, 0 to 1. */
	alternation: number;
	sameFinger: number;
	reach: number;
	score: number;
}

/** Scores a word for typing flow; higher is smoother. */
export function flowScore(word: string, rank = 0): FlowScore {
	const keys = [...word].map((c) => LAYOUT[c]!);
	let switches = 0;
	let sameFinger = 0;
	let jumps = 0;
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1]!;
		const b = keys[i]!;
		if (a.hand !== b.hand) switches++;
		else if (word[i] !== word[i - 1]) {
			if (a.finger === b.finger) sameFinger++;
			if (Math.abs(a.row - b.row) === 2) jumps++;
		}
	}
	const transitions = Math.max(1, keys.length - 1);
	const alternation = switches / transitions;
	const reach = keys.reduce((sum, k) => sum + Math.abs(k.row) + k.stretch, 0) / keys.length;
	const frequency = 1 - Math.min(rank, 1000) / 1000;
	const score = alternation * 2.4 - (sameFinger / transitions) * 3 - (jumps / transitions) * 1.5 - reach * 1.1 + frequency * 1.2;
	return { word, rank, alternation, sameFinger, reach, score };
}

/** Frequent in the source list but not everyday words: terms from grammar, maths and science. */
const NOT_EVERYDAY = new Set(['vowel', 'noun', 'verb', 'suffix', 'numeral', 'equate', 'decimal', 'quotient', 'syllable', 'consonant', 'molecule', 'fraction', 'multiply', 'subtract', 'stead', 'pose', 'port', 'differ', 'self', 'govern', 'atom', 'oxygen', 'magnet', 'plural', 'segment', 'populate']);

/** Every frequent word with its score, most frequent first. */
export const SCORED_WORDS: readonly FlowScore[] = FREQUENT_WORDS.map((w, i) => flowScore(w, i)).filter((s) => s.word.length >= 2 && s.word.length <= 7 && !NOT_EVERYDAY.has(s.word));

/**
 * The words used in examinations, including the competitive test: the best-flowing of the most
 * frequent words, ordered by frequency. Single letters and very long words are left out.
 */
export const FLOW_WORDS: readonly string[] = [...SCORED_WORDS]
	.filter((s) => s.sameFinger === 0 && s.rank < 750)
	.sort((a, b) => b.score - a.score)
	.slice(0, 260)
	.sort((a, b) => a.rank - b.rank)
	.map((s) => s.word);
