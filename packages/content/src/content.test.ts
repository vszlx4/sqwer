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

describe('flow words', async () => {
	const { FLOW_WORDS, FREQUENT_WORDS, SCORED_WORDS, flowScore } = await import('./index.ts');

	it('are everyday words from the most frequent list, without same-finger pairs', () => {
		expect(FLOW_WORDS.length).toBeGreaterThanOrEqual(200);
		for (const w of FLOW_WORDS) {
			expect(FREQUENT_WORDS.indexOf(w)).toBeLessThan(750);
			expect(flowScore(w).sameFinger).toBe(0);
		}
		for (const w of ['the', 'and', 'to', 'is', 'it', 'for', 'with']) expect(FLOW_WORDS).toContain(w);
	});

	it('alternate hands more often and reach less than frequent words in general', () => {
		const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
		const flow = FLOW_WORDS.map((w) => flowScore(w));
		expect(mean(flow.map((s) => s.alternation))).toBeGreaterThan(mean(SCORED_WORDS.map((s) => s.alternation)));
		expect(mean(flow.map((s) => s.reach))).toBeLessThan(mean(SCORED_WORDS.map((s) => s.reach)));
	});

	it('rate a hand-alternating home-row word above a one-hand stretch', () => {
		expect(flowScore('fish').score).toBeGreaterThan(flowScore('were').score);
	});
});
