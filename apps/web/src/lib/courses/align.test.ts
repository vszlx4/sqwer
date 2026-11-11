import { describe as group, expect, it } from 'vitest';
import { align, describe, plain, spoken } from './align.ts';

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
	const say = (typed: string, word: string) => plain(describe(align(typed, word)));

	it('names the letters that differ', () => {
		expect(say('nitch', 'niche')).toBe('You added t and missed e.');
		expect(say('cat', 'cut')).toBe('You wrote a for u.');
		expect(say('lisen', 'listen')).toBe('You missed t.');
	});

	it('keeps the letters apart from the text', () => {
		expect(describe(align('nitch', 'niche'))).toEqual(['You ', 'added ', { letter: 't' }, ' and ', 'missed ', { letter: 'e' }, '.']);
	});

	it('says plainly when the word is different or far off', () => {
		expect(say('dog', 'sun')).toBe('A different word from the one spoken.');
		expect(say('abcdefgh', 'abxyzwgh')).toBe('Several letters differ from the word.');
		expect(say('niche', 'niche')).toBe('Spelled exactly right.');
	});
});

group('spoken', () => {
	it('spells both words out', () => {
		expect(spoken('nitch', 'niche')).toBe('You typed n i t c h. The word is n i c h e.');
	});
});
