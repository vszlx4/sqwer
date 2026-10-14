import { describe, expect, it } from 'vitest';
import { pressesFor, qwertyAnsi } from './index.ts';

describe('qwertyAnsi', () => {
	for (const platform of ['mac', 'pc'] as const) {
		it(`${platform}: every row spans exactly 15u`, () => {
			const layout = qwertyAnsi(platform);
			for (let y = 0; y < 5; y++) {
				const row = layout.keys.filter((k) => Math.floor(k.y) === y && !k.code.startsWith('Arrow'));
				const arrows = y === 4 && platform === 'mac' ? 3 : 0;
				expect(row.reduce((s, k) => s + k.w, 0) + arrows).toBe(15);
			}
		});

		it(`${platform}: maps every printable ASCII character`, () => {
			const layout = qwertyAnsi(platform);
			for (let c = 32; c < 127; c++) {
				expect(layout.chars.has(String.fromCharCode(c)), String.fromCharCode(c)).toBe(true);
			}
		});
	}
});

describe('pressesFor', () => {
	const layout = qwertyAnsi('pc');

	it('uses the home finger for lowercase letters', () => {
		expect(pressesFor(layout, 'f')).toEqual([{ code: 'KeyF', finger: 'li' }]);
		expect(pressesFor(layout, 'p')).toEqual([{ code: 'KeyP', finger: 'rp' }]);
	});

	it('uses the opposite-hand shift for capitals and symbols', () => {
		expect(pressesFor(layout, 'A')).toEqual([
			{ code: 'ShiftRight', finger: 'rp' },
			{ code: 'KeyA', finger: 'lp' }
		]);
		expect(pressesFor(layout, '?')).toEqual([
			{ code: 'ShiftLeft', finger: 'lp' },
			{ code: 'Slash', finger: 'rp' }
		]);
	});

	it('alternates the space thumb against the previous hand', () => {
		expect(pressesFor(layout, ' ', 'k')).toEqual([{ code: 'Space', finger: 'lt' }]);
		expect(pressesFor(layout, ' ', 'e')).toEqual([{ code: 'Space', finger: 'rt' }]);
	});

	it('returns nothing for unmapped characters', () => {
		expect(pressesFor(layout, 'é')).toEqual([]);
	});
});
