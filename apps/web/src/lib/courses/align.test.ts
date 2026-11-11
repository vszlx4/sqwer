import { describe as group, expect, it } from 'vitest';
import { align, describe, spoken } from './align.ts';

const marks = (typed: string, word: string, variant = false) => align(typed, word, variant).map((s) => s.mark);

group('align', () => {
	it('keeps an exact answer letter for letter', () => {
		expect(marks('niche', 'niche')).toEqual(['same', 'same', 'same', 'same', 'same']);
	});

	it('marks an extra and a missing letter', () => {
		const slots = align('nitch', 'niche');
		expect(slots.map((s) => s.mark)).toEqual(['same', 'same', 'extra', 'same', 'same', 'missing']);
		expect(slots.map((s) => s.typed).join('')).toBe('nitch');
		expect(slots.map((s) => s.word).join('')).toBe('niche');
	});

	it('marks a wrong letter in place', () => {
		expect(marks('cat', 'cut')).toEqual(['same', 'wrong', 'same']);
	});

	it('turns differences into variants for an accepted spelling', () => {
		expect(marks('colour', 'color', true)).toEqual(['same', 'same', 'same', 'same', 'variant', 'same']);
	});

	it('handles an empty side', () => {
		expect(marks('', 'ok')).toEqual(['missing', 'missing']);
	});
});

group('describe', () => {
	it('counts what differs in plain words', () => {
		expect(describe(align('nitch', 'niche'))).toBe('One extra letter and one missing letter.');
		expect(describe(align('cat', 'cut'))).toBe('One wrong letter.');
		expect(describe(align('recieve', 'receive'))).toBe('Two wrong letters.');
	});

	it('names a completely different word', () => {
		expect(describe(align('dog', 'sun'))).toBe('A different word.');
	});
});

group('spoken', () => {
	it('spells both words out', () => {
		expect(spoken('nitch', 'niche')).toBe('You typed n i t c h. The word is n i c h e.');
	});
});
