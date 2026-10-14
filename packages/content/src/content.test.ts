import { describe, expect, it } from 'vitest';
import { ENGLISH_WORDS, seededRandom, WordGenerator } from './index.ts';

describe('WordGenerator', () => {
	it('is deterministic for a seed', () => {
		const a = new WordGenerator({}, seededRandom(7)).next(30);
		const b = new WordGenerator({}, seededRandom(7)).next(30);
		expect(a).toEqual(b);
	});

	it('never repeats a word back to back', () => {
		const words = new WordGenerator({}, seededRandom(1)).next(500);
		for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1]);
	});

	it('produces only plain lowercase words by default', () => {
		for (const w of new WordGenerator({}, seededRandom(3)).next(300)) expect(w).toMatch(/^[a-z]+$/);
	});

	it('adds punctuation and capitals when asked', () => {
		const words = new WordGenerator({ punctuation: true }, seededRandom(5)).next(300);
		expect(words[0]![0]).toMatch(/[A-Z]/);
		expect(words.some((w) => /[.,?!;:"()]/.test(w))).toBe(true);
	});

	it('adds numbers when asked', () => {
		const words = new WordGenerator({ numbers: true }, seededRandom(9)).next(300);
		expect(words.some((w) => /^\d+$/.test(w))).toBe(true);
	});

	it('has a deduplicated vocabulary of reasonable size', () => {
		expect(new Set(ENGLISH_WORDS).size).toBe(ENGLISH_WORDS.length);
		expect(ENGLISH_WORDS.length).toBeGreaterThan(300);
	});
});
