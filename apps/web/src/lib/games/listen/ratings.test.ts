import { describe, expect, it } from 'vitest';
import { WordMemory, forgetWordMemory } from './memory.ts';
import { forgetRatings, ratingOf, setRating } from './ratings.ts';

function fakeStore() {
	const m = new Map<string, string>();
	return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), size: () => m.size };
}

describe('clip ratings', () => {
	it('keeps, changes and removes a rating', () => {
		const s = fakeStore();
		expect(ratingOf('water', s)).toBe(0);
		setRating('water', 2, s);
		setRating('cat', 5, s);
		expect(ratingOf('water', s)).toBe(2);
		setRating('water', 0, s);
		expect(ratingOf('water', s)).toBe(0);
		expect(ratingOf('cat', s)).toBe(5);
	});

	it('reads unreadable storage as unrated', () => {
		const s = fakeStore();
		s.setItem('sqwer:clip-ratings', '{oops');
		expect(ratingOf('cat', s)).toBe(0);
	});
});

describe('clearing learning data', () => {
	it('forgets ratings and word memory', () => {
		const s = fakeStore();
		setRating('cat', 4, s);
		new WordMemory(s).record('cat', 'exact', 1000);
		expect(new WordMemory(s).get('cat')).toBeDefined();
		forgetRatings(s);
		forgetWordMemory(s);
		expect(ratingOf('cat', s)).toBe(0);
		expect(new WordMemory(s).get('cat')).toBeUndefined();
		expect(s.size()).toBe(0);
	});
});
