/*
 * The smart word picker for Listen and type. Words are drawn by weight: unseen and due words first, missed words
 * more often, words still resting rarely, and words that fit the level's difficulty more than ones that do not.
 * Words that could be confused (sound-alikes, look-alikes like form/from, forms of one word like walk/walked) are
 * never in one round and are kept MINUTES apart. A small pool relaxes the rules in order, so a round always fills.
 */

import { editDistance, soundsAlike, type HeardData } from '@sqwer/content';
import { isSpeakable } from '#lib/voice/clip.ts';
import { MINUTE, type WordMemory } from './memory.ts';

/** Confusable words are kept this many minutes apart. */
export const MINUTES = 10;
/** Large pools are sampled down to this many words before weighing. */
const SAMPLE = 2000;

/** Spellings that do not follow the sound, or follow it in several ways. */
const HARD = /ough|augh|eigh|igh|gh|ph|kn|wr|gn|mb|ps|rh|sch|eau|ae|oe|ie|ei|qu|x|c[eiy]|g[eiy]|dge|tch|[st]ion|cious|tious|ous/g;

/**
 * How hard a word is to spell by ear: length, unusual spellings, doubled letters, and how rare it is (`rank` from 0,
 * the most common, to 1, the rarest in its list).
 */
export function difficulty(word: string, rank = 0.5): number {
	const hard = word.match(HARD)?.length ?? 0;
	const doubles = word.match(/(.)\1/g)?.length ?? 0;
	return word.length * 0.6 + hard * 1.2 + doubles * 0.8 + rank * 3;
}

const SUFFIX = /(?:ies|es|s|ed|d|ing|er|ers|est|ly)$/;
/** A rough stem, so forms of one word meet: walks, walked, walking → walk. */
function stem(word: string): string {
	if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
	const s = word.replace(SUFFIX, '');
	return s.length >= 3 ? s.replace(/(.)\1$/, '$1').replace(/e$/, '') : word;
}

/** Whether two words could be taken for each other: same sound, one slip apart, or forms of one word. */
export function confusable(a: string, b: string, data?: HeardData): boolean {
	if (a === b) return true;
	if (soundsAlike(a, b, data)) return true;
	if (Math.min(a.length, b.length) >= 4 && editDistance(a, b) === 1) return true;
	return stem(a) === stem(b);
}

export interface PickOptions {
	/** Words to pick. */
	n: number;
	/** Random numbers from 0 to 1; seeded in tests. */
	rand: () => number;
	now?: number;
	memory?: WordMemory;
	/** Endless level, for the difficulty fit; null in lessons. */
	level?: number | null;
	/** Words already in the round or queued: never picked again, never confused with. */
	taken?: readonly string[];
	/** Words with a voice clip; others are never picked. */
	voiced?: (word: string) => boolean;
	data?: HeardData;
}

/** Rules in the order a small pool gives them up. */
const STAGES = [
	{ resting: false, apart: true, round: true, repeat: false },
	{ resting: true, apart: true, round: true, repeat: false },
	{ resting: true, apart: false, round: true, repeat: false },
	{ resting: true, apart: false, round: false, repeat: false },
	{ resting: true, apart: false, round: false, repeat: true }
] as const;

/** `n` words from `pool`, in play order. Fewer only when the pool has fewer voiced words. */
export function pick(pool: readonly string[], options: PickOptions): string[] {
	const { n, rand, now = Date.now(), memory, level = null, taken = [], voiced = () => true, data } = options;
	const seen = new Set<string>();
	const ranked: { word: string; rank: number }[] = [];
	pool.forEach((raw, i) => {
		const word = raw.toLowerCase();
		if (seen.has(word) || !isSpeakable(word) || !voiced(word)) return;
		seen.add(word);
		ranked.push({ word, rank: pool.length > 1 ? i / (pool.length - 1) : 0 });
	});
	let words = ranked;
	if (words.length > SAMPLE) {
		// Partial shuffle: SAMPLE random words, cheaply.
		words = [...ranked];
		for (let i = 0; i < SAMPLE; i++) {
			const j = i + Math.floor(rand() * (words.length - i));
			[words[i], words[j]] = [words[j]!, words[i]!];
		}
		words = words.slice(0, SAMPLE);
	}

	// Level fit: the level's share of the pool's difficulty range, 1 the easiest end and 12 the hardest.
	const scores = new Map(words.map((w) => [w.word, difficulty(w.word, w.rank)]));
	let target = 0;
	let spread = 1;
	if (level !== null && words.length > 1) {
		const sorted = [...scores.values()].sort((a, b) => a - b);
		target = sorted[Math.round(((Math.min(12, Math.max(1, level)) - 1) / 11) * (sorted.length - 1))]!;
		spread = Math.max(1, (sorted.at(-1)! - sorted[0]!) / 4);
	}

	const recent = memory?.heardSince(now - MINUTES * MINUTE) ?? [];
	const out: string[] = [];
	const inRound = [...taken];

	const weight = (word: string, resting: boolean): number => {
		const rec = memory?.get(word);
		let w = 1;
		if (rec) {
			if (rec.due > now) {
				if (!resting) return 0;
				w = 0.15;
			} else w = 1 + Math.min(2, (now - rec.due) / (7 * 24 * 60 * MINUTE)) + 0.5 * Math.min(4, rec.misses);
		}
		if (level !== null) w *= Math.exp(-Math.abs(scores.get(word)! - target) / spread);
		return w;
	};

	while (out.length < n) {
		let chosen: string | null = null;
		for (const stage of STAGES) {
			const eligible: { word: string; w: number }[] = [];
			for (const { word } of words) {
				if (!stage.repeat && inRound.includes(word)) continue;
				if (stage.round && inRound.some((t) => t !== word && confusable(word, t, data))) continue;
				if (stage.apart && recent.some((t) => confusable(word, t, data))) continue;
				const w = weight(word, stage.resting);
				if (w > 0) eligible.push({ word, w });
			}
			if (!eligible.length) continue;
			let r = rand() * eligible.reduce((s, e) => s + e.w, 0);
			chosen = eligible.at(-1)!.word;
			for (const e of eligible) {
				r -= e.w;
				if (r <= 0) {
					chosen = e.word;
					break;
				}
			}
			break;
		}
		if (!chosen) break;
		out.push(chosen);
		inRound.push(chosen);
	}
	return out;
}
