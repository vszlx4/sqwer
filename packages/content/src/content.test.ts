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

	it('use American spelling', () => {
		const all = new Set(WORD_TIERS.flat());
		for (const w of ['catalogue', 'grey', 'whilst', 'amongst', 'judgement', 'enquiry', 'cancelled', 'colour', 'centre', 'towards']) expect(all.has(w)).toBe(false);
	});
});

describe('plain test casing', () => {
	it('lowercases words without punctuation and keeps their casing with it', () => {
		const words = ['Texas', 'NASA', 'I'];
		for (const w of new WordGenerator({ words }, seededRandom(2)).next(60)) expect(w).toBe(w.toLowerCase());
		const punctuated = new WordGenerator({ words, punctuation: true }, seededRandom(2)).next(60);
		expect(punctuated.some((w) => /NASA/.test(w))).toBe(true);
	});
});

describe('word lists', async () => {
	const { readFileSync } = await import('node:fs');
	const { DEFAULT_WORD_LIST, EXAM_WORDS, parseWordList, WORD_LIST_IDS, WORD_LISTS } = await import('./index.ts');
	const read = (id: string) => parseWordList(readFileSync(new URL(`../lists/${id}.txt`, import.meta.url), 'utf8'));

	it('describe every list once, with the exam list as the default', () => {
		expect(WORD_LISTS.map((l) => l.id)).toEqual([...WORD_LIST_IDS]);
		expect(DEFAULT_WORD_LIST).toBe('english-200');
		expect(WORD_LISTS[0]!.size).toBe(EXAM_WORDS.length);
	});

	it('match their files: declared size, unique, typeable on a standard keyboard', () => {
		for (const l of WORD_LISTS.filter((l) => l.id !== 'english-200')) {
			const words = read(l.id);
			expect(words, l.id).toHaveLength(l.size);
			expect(new Set(words).size, l.id).toBe(words.length);
			for (const w of words) expect(w, l.id).toMatch(/^[A-Za-z'-]+$/);
		}
	});

	it('grow from the 200 to the 450k list', () => {
		const english = WORD_LISTS.filter((l) => l.group === 'English');
		for (let i = 1; i < english.length; i++) expect(english[i]!.size).toBeGreaterThan(english[i - 1]!.size);
	});
});

describe('word list credits', async () => {
	const { WORD_LISTS } = await import('./index.ts');

	it('name the source file and author of every list', () => {
		for (const l of WORD_LISTS) {
			expect(l.credit.file, l.id).toMatch(/^english(_[a-z0-9]+)*\.json$/);
			expect(l.credit.author, l.id).not.toBe('');
		}
	});
});
