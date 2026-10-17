import { wordsUsing } from '@sqwer/content';
import type { DrillSource } from './types.ts';

/** A small seeded random number generator, so a drill can be reproduced in tests. */
export function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffle<T>(list: readonly T[], rand: () => number): T[] {
	const out = [...list];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j]!, out[i]!];
	}
	return out;
}

const pick = <T>(list: readonly T[], rand: () => number) => list[Math.floor(rand() * list.length)]!;

/**
 * Letter groups for learning new keys. The first groups repeat a single new key ("fff"),
 * so the finger learns its position; later groups mix new and known keys, two thirds new.
 */
export function patternGroups(pool: string, focus: string, groups: number, rand: () => number): string[] {
	const focusKeys = [...focus];
	const poolKeys = [...new Set(pool)];
	const out: string[] = [];
	for (let g = 0; g < groups; g++) {
		if (g < Math.min(4, focusKeys.length * 2)) {
			out.push(focusKeys[g % focusKeys.length]!.repeat(3));
			continue;
		}
		const length = 2 + Math.floor(rand() * 3);
		let group = '';
		for (let i = 0; i < length; i++) group += rand() < 0.65 ? pick(focusKeys, rand) : pick(poolKeys, rand);
		// Avoid repeating the previous group exactly.
		out.push(group === out[out.length - 1] ? group.split('').reverse().join('') : group);
	}
	return out;
}

/** Each chosen word appears `repeat` times in a row, so it can be memorised as a movement. */
export function repeated(words: readonly string[], repeat: number): string[] {
	return words.flatMap((w) => Array.from({ length: repeat }, () => w));
}

/** The words (tokens) to type for a drill or checkpoint. */
export function drillTokens(source: DrillSource, rand: () => number): string[] {
	switch (source.type) {
		case 'patterns':
			return patternGroups(source.pool, source.focus, source.groups, rand);
		case 'words': {
			const candidates = wordsUsing(source.pool, source.focus);
			// Prefer shorter words while there are few to choose from.
			const shortlist = candidates.slice(0, Math.max(source.count * 3, 16));
			return repeated(shuffle(shortlist, rand).slice(0, source.count), source.repeat);
		}
		case 'list':
			// An item can be a short phrase ("you & me"): its words are typed in order, each followed
			// by a space like any other word, so the space inside a phrase never skips the rest of it.
			return repeated(shuffle(source.words, rand), source.repeat).flatMap((item) => item.split(/\s+/).filter(Boolean));
		case 'sentences':
			return shuffle(source.sentences, rand)
				.slice(0, source.count)
				.flatMap((s) => s.split(' '));
	}
}

/** Words for the falling and listening activities. */
export function activityWords(pool: string, focus: string, list: readonly string[] | undefined, rand: () => number): string[] {
	const words = list?.length ? [...list] : wordsUsing(pool, focus);
	return shuffle(words.length ? words : [...pool], rand);
}
