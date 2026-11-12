import { describe, expect, it } from 'vitest';
import { qwertyAnsi } from '@sqwer/layouts';
import { checkHeard, compareLetters, editDistance, loadHeardData, neighbors, soundKey, type HeardData, type HeardKind, type Mistake } from '../index.ts';

const WORDS = new Set(['house', 'horse', 'mouse', 'form', 'from', 'cat', 'cut', 'kite', 'phone', 'circle']);
const isWord = (w: string) => WORDS.has(w);

describe('checkHeard', () => {
	const cases: [target: string, answer: string, kind: HeardKind, detail?: string][] = [
		// exact: capitals, spaces and curly apostrophes ignored
		['house', 'house', 'exact'],
		['January', 'january', 'exact'],
		["it's", ' It’s ', 'exact'],
		// accepted: written differently, another spelling, a sound-alike
		["don't", 'dont', 'accepted', 'written'],
		['ice cream', 'icecream', 'accepted', 'written'],
		['ice cream', 'ice-cream', 'accepted', 'written'],
		['color', 'colour', 'accepted', 'spelling'],
		['colour', 'color', 'accepted', 'spelling'],
		['organization', 'organisation', 'accepted', 'spelling'],
		['their', 'there', 'accepted', 'sound'],
		['two', 'too', 'accepted', 'sound'],
		// misheard: another real word, even one letter away
		['house', 'horse', 'misheard'],
		['from', 'form', 'misheard'],
		// close: one slip on a word of five letters or more
		['house', 'hosue', 'close', 'swap'],
		['house', 'hpuse', 'close', 'neighbor'],
		['house', 'hxuse', 'close', 'changed'],
		['house', 'housse', 'close', 'double'],
		['house', 'huse', 'close', 'missing'],
		['house', 'houske', 'close', 'extra'],
		['house', 'houase', 'close', 'neighbor'],
		// close: a spelling that reads the same, at any length
		['phone', 'fone', 'close', 'sounds-right'],
		['circle', 'sircle', 'close', 'sounds-right'],
		['elephant', 'elephent', 'close', 'sounds-right'],
		['separate', 'seperate', 'close', 'sounds-right'],
		['house', 'hous', 'close', 'sounds-right'],
		['definitely', 'definately', 'close', 'sounds-right'],
		['knife', 'nife', 'close', 'sounds-right'],
		// wrong: short words must be exact, two slips, nothing typed
		['cat', 'cta', 'wrong'],
		['form', 'fomr', 'wrong'],
		['house', 'hosuee', 'wrong'],
		['kite', 'kat', 'wrong'],
		['house', '', 'wrong'],
		['house', 'zzzz', 'wrong']
	];

	it.each(cases)('%s ← %s: %s %s', (target, answer, kind, detail) => {
		const r = checkHeard(target, answer, { isWord });
		expect(r.kind).toBe(kind);
		if (kind === 'accepted') expect(r.accepted).toBe(detail);
		if (kind === 'close') expect(r.mistake).toBe(detail as Mistake);
	});

	it('scores exact and accepted 1, close half, misheard and wrong nothing', () => {
		expect(checkHeard('house', 'house').points).toBe(1);
		expect(checkHeard('their', 'there').points).toBe(1);
		expect(checkHeard('house', 'hosue').points).toBe(0.5);
		expect(checkHeard('house', 'horse', { isWord }).points).toBe(0);
		expect(checkHeard('house', 'zzzz').points).toBe(0);
	});

	it('keeps the written form of the word, capitals included', () => {
		const r = checkHeard('January', 'janury');
		expect(r.word).toBe('January');
		expect(r.kind).toBe('close');
		expect(checkHeard("don't", 'dont').word).toBe("don't");
	});

	it('shows both spellings when the word has a British one', () => {
		expect(checkHeard('color', 'color').spellings).toEqual({ american: 'color', british: 'colour' });
		expect(checkHeard('colour', 'color').spellings).toEqual({ american: 'color', british: 'colour' });
		expect(checkHeard('house', 'house').spellings).toBeUndefined();
	});

	it('takes sound-alikes and spellings from the set data', () => {
		const data: HeardData = { sounds: [['gnome', 'nome']], variants: [['tonne', 'ton']] };
		expect(checkHeard('gnome', 'nome').kind).not.toBe('accepted');
		expect(checkHeard('gnome', 'nome', { data })).toMatchObject({ kind: 'accepted', accepted: 'sound' });
		expect(checkHeard('ton', 'tonne', { data })).toMatchObject({ kind: 'accepted', accepted: 'spelling' });
		expect(checkHeard('ton', 'ton', { data }).spellings).toEqual({ american: 'ton', british: 'tonne' });
	});

	it('compares letters for every result', () => {
		expect(checkHeard('house', 'hosue').letters.map((l) => l.mark)).toEqual(['right', 'right', 'swapped', 'swapped', 'right']);
		expect(checkHeard('January', 'January').letters.every((l) => l.mark === 'right')).toBe(true);
	});
});

describe('compareLetters', () => {
	const marks = (typed: string, word: string) => compareLetters(typed, word).map((l) => `${l.typed || '_'}${l.word || '_'}${l.mark[0]}`).join(' ');

	it('marks right, changed, extra, missing and swapped letters', () => {
		expect(marks('cat', 'cat')).toBe('ccr aar ttr');
		expect(marks('cut', 'cat')).toBe('ccr uac ttr');
		expect(marks('catt', 'cat')).toBe('ccr aar t_e ttr');
		expect(marks('ct', 'cat')).toBe('ccr _am ttr');
		expect(marks('cta', 'cat')).toBe('ccr tas ats');
	});

	it('counts a swap as one edit', () => {
		expect(editDistance('hosue', 'house')).toBe(1);
		expect(editDistance('cta', 'cat')).toBe(1);
		expect(editDistance('', 'cat')).toBe(3);
	});
});

describe('keyboard neighbors', () => {
	it('reads neighbors from the layout, across rows', () => {
		const near = neighbors(qwertyAnsi('mac'));
		expect([...near.get('g')!].sort()).toEqual(['b', 'f', 'h', 't', 'v', 'y']);
		expect(near.get('q')!.has('w')).toBe(true);
		expect(near.get('a')!.has('l')).toBe(false);
	});
});

describe('soundKey', () => {
	it('meets spellings that read the same', () => {
		for (const [a, b] of [
			['fone', 'phone'],
			['sircle', 'circle'],
			['elephent', 'elephant'],
			['recieve', 'receive'],
			['rong', 'wrong'],
			['nife', 'knife'],
			['nite', 'night']
		])
			expect(soundKey(a!), `${a} / ${b}`).toBe(soundKey(b!));
	});

	it('keeps different sounds apart', () => {
		for (const [a, b] of [
			['kat', 'kite'],
			['bed', 'bad'],
			['ship', 'chip'],
			['thin', 'tin']
		])
			expect(soundKey(a!), `${a} / ${b}`).not.toBe(soundKey(b!));
	});
});

describe('set data', () => {
	it('loads each set once, with groups and pairs in shape', async () => {
		const data = await loadHeardData('english-1k');
		expect(await loadHeardData('english-1k')).toBe(data);
		expect(Array.isArray(data.sounds) && Array.isArray(data.variants)).toBe(true);
		for (const g of data.sounds) expect(g.length).toBeGreaterThan(1);
		for (const p of data.variants) expect(p).toHaveLength(2);
	});
});
