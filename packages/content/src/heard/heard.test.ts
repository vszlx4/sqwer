import { describe, expect, it } from 'vitest';
import { americanSpelling, matchHeard, normalizeAnswer, soundsAlike } from '../index.ts';

describe('matchHeard', () => {
	it('accepts the word itself, ignoring case, spaces and curly apostrophes', () => {
		expect(matchHeard('house', ' House ')).toEqual({ ok: true, how: 'exact' });
		expect(matchHeard("it's", 'it’s')).toEqual({ ok: true, how: 'exact' });
	});

	it('rejects other words and empty answers', () => {
		expect(matchHeard('house', 'horse').ok).toBe(false);
		expect(matchHeard('house', '  ').ok).toBe(false);
	});

	it('accepts British spellings in either direction', () => {
		for (const [us, uk] of [
			['color', 'colour'],
			['favorite', 'favourite'],
			['organize', 'organise'],
			['organization', 'organisation'],
			['analyzed', 'analysed'],
			['center', 'centre'],
			['theaters', 'theatres'],
			['traveled', 'travelled'],
			['counselor', 'counsellor'],
			['defense', 'defence'],
			['catalog', 'catalogue'],
			['gray', 'grey'],
			['program', 'programme'],
			['fulfill', 'fulfil'],
			['learned', 'learnt']
		]) {
			expect(matchHeard(us!, uk!)).toEqual({ ok: true, how: 'spelling' });
			expect(matchHeard(uk!, us!)).toEqual({ ok: true, how: 'spelling' });
		}
	});

	it('does not stretch spelling rules onto unrelated words', () => {
		for (const [a, b] of [
			['advertise', 'advertize'],
			['rise', 'rize'],
			['travel', 'travell'],
			['hour', 'hor'],
			['polling', 'poling'],
			['aloe', 'ale']
		]) {
			expect(matchHeard(a!, b!).ok).toBe(false);
		}
	});

	it('accepts words that sound the same', () => {
		expect(matchHeard('their', 'there')).toEqual({ ok: true, how: 'sound' });
		expect(matchHeard('two', 'too')).toEqual({ ok: true, how: 'sound' });
		expect(matchHeard('read', 'red')).toEqual({ ok: true, how: 'sound' });
		expect(matchHeard('read', 'reed')).toEqual({ ok: true, how: 'sound' });
		expect(matchHeard('your', "you're")).toEqual({ ok: true, how: 'sound' });
	});

	it('keeps separate sound groups apart', () => {
		// read sounds like red and like reed, but red and reed differ.
		expect(soundsAlike('red', 'reed')).toBe(false);
		expect(matchHeard('lead', 'lean').ok).toBe(false);
	});
});

describe('spelling helpers', () => {
	it('normalizes answers', () => {
		expect(normalizeAnswer('  Two  Words ')).toBe('two words');
	});

	it('maps other spellings onto the American one and leaves the rest alone', () => {
		expect(americanSpelling('Colour')).toBe('color');
		expect(americanSpelling('color')).toBe('color');
		expect(americanSpelling('house')).toBe('house');
	});
});
