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

describe('examination words', async () => {
	const { EXAM_WORDS } = await import('./index.ts');

	it('are two hundred distinct words of letters only', () => {
		expect(EXAM_WORDS).toHaveLength(200);
		expect(new Set(EXAM_WORDS).size).toBe(200);
		for (const w of EXAM_WORDS) expect(w).toMatch(/^[a-zA-Z]+$/);
		expect(EXAM_WORDS.slice(0, 4)).toEqual(['the', 'be', 'of', 'and']);
	});
});

describe('word tiers', async () => {
	const { WORD_TIERS, STARTER_WORDS, ADVANCED_WORDS } = await import('./sets.ts');

	it('hold distinct lowercase words, each in only one tier', () => {
		const all = WORD_TIERS.flat();
		expect(new Set(all).size).toBe(all.length);
		for (const w of all) expect(w).toMatch(/^[a-z]+$/);
	});

	it('grow longer from the easiest tier to the hardest', () => {
		const mean = (ws: readonly string[]) => ws.reduce((n, w) => n + w.length, 0) / ws.length;
		expect(Math.max(...STARTER_WORDS.map((w) => w.length))).toBeLessThanOrEqual(5);
		expect(mean(ADVANCED_WORDS)).toBeGreaterThan(mean(STARTER_WORDS) + 2);
	});

	it('leave out words unsuited to the games', () => {
		const all = new Set(WORD_TIERS.flat());
		for (const w of ['kill', 'casino', 'erotic', 'drugs', 'gambling', 'asp', 'cant']) expect(all.has(w)).toBe(false);
	});
});
