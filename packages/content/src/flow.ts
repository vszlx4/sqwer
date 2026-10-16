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

/** The three-letter sequences inside a word. */
export const trigrams = (word: string): string[] => Array.from({ length: Math.max(0, word.length - 2) }, (_, i) => word.slice(i, i + 3));

/** Size of the examination word set, and the number of distinct trigrams it covers. */
export const FLOW_SIZE = 200;
export const FLOW_TRIGRAMS = 337;

/**
 * Picks `size` words from a pool ordered best first so that together they hold exactly `target`
 * distinct trigrams: the best words are taken while they fit, then the least frequent words are
 * exchanged for the best-scored words that add the trigrams still missing. Deterministic, so the set is the same on every page.
 */
function choose(pool: readonly FlowScore[], size: number, target: number, keep: ReadonlySet<string>): FlowScore[] {
	const counts = new Map<string, number>();
	const count = (w: string, d: number) =>
		trigrams(w).forEach((g) => {
			const n = (counts.get(g) ?? 0) + d;
			if (n) counts.set(g, n);
			else counts.delete(g);
		});
	const fresh = (w: string) => new Set(trigrams(w).filter((g) => !counts.has(g))).size;
	const chosen: FlowScore[] = [];
	const rest: FlowScore[] = [];
	for (const s of pool) {
		if (chosen.length < size && counts.size + fresh(s.word) <= target) {
			chosen.push(s);
			count(s.word, 1);
		} else rest.push(s);
	}
	// Exchange the least frequent words (never one of the hundred most frequent) for better-scored ones until the target is met exactly.
	while (counts.size < target) {
		const need = target - counts.size;
		let swap: { out: number; next: FlowScore } | null = null;
		const victims = chosen.map((s, i) => ({ s, i })).filter(({ s }) => !keep.has(s.word) && s.rank >= 100).sort((x, y) => y.s.rank - x.s.rank);
		for (const next of rest) {
			const adds = new Set(trigrams(next.word).filter((g) => !counts.has(g)));
			if (!adds.size) continue;
			const victim = victims.find(({ s }) => {
				const lost = new Set(trigrams(s.word).filter((g) => counts.get(g) === 1 && !trigrams(next.word).includes(g))).size;
				const gain = adds.size - lost;
				return gain >= 1 && gain <= need;
			});
			if (victim) {
				swap = { out: victim.i, next };
				break;
			}
		}
		if (!swap) break;
		count(chosen[swap.out]!.word, -1);
		rest.push(chosen[swap.out]!);
		chosen.splice(swap.out, 1);
		rest.splice(rest.indexOf(swap.next), 1);
		chosen.push(swap.next);
		count(swap.next.word, 1);
	}
	return chosen;
}

/** The longest word in the examination set. */
export const FLOW_MAX_LENGTH = 5;
/** Short function words every examination set includes, whatever their score. */
export const FLOW_REQUIRED: readonly string[] = ['a', 'an', 'and', 'to', 'or', 'two', 'one', 'as', 'of', 'from', 'for'];

/** Words left out of the examination set by editorial choice. */
export const FLOW_EXCLUDED: ReadonlySet<string> = new Set(['boat', 'bird', 'usual', 'foot', 'six', 'song', 'paper', 'south', 'black', 'field', 'fire', 'inch', 'rock', 'sing', 'spell', 'laugh', 'sea', 'blue', 'girl', 'five', 'shape', 'half', 'got', 'light', 'farm']);

/**
 * The words used in examinations, including the competitive test: 200 words of at most five
 * letters from the 600 most frequent, chosen for flow, covering 337 distinct trigrams and always
 * including the required short words. Ordered by frequency.
 */
export const FLOW_WORDS: readonly string[] = (() => {
	const keep = new Set(FLOW_REQUIRED);
	const scored = FREQUENT_WORDS.map((w, i) => flowScore(w, i)).filter((s) => s.word.length <= FLOW_MAX_LENGTH && !NOT_EVERYDAY.has(s.word));
	const required = FLOW_REQUIRED.map((w) => scored.find((s) => s.word === w) ?? flowScore(w, FREQUENT_WORDS.length));
	const rest = scored.filter((s) => !keep.has(s.word) && !FLOW_EXCLUDED.has(s.word) && s.word.length >= 2 && s.sameFinger === 0 && s.rank < 600).sort((a, b) => b.score - a.score);
	return choose([...required, ...rest], FLOW_SIZE, FLOW_TRIGRAMS, keep)
		.sort((a, b) => a.rank - b.rank)
		.map((s) => s.word);
})();
