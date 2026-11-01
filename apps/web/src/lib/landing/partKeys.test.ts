import { describe, expect, it } from 'vitest';
import { LESSONS, PARTS } from '#lib/courses/catalog.ts';
import { gridKey, partKeys, partLessons } from './partKeys.ts';

describe('part keys', () => {
	it('maps characters and Shift onto the grid', () => {
		expect(gridKey('F')).toBe('f');
		expect(gridKey('?')).toBe('/');
		expect(gridKey('ShiftLeft')).toBe('shift-l');
		expect(gridKey(' ')).toBeNull();
	});

	it('brings in the letters first and nothing twice', () => {
		const first = partKeys(0);
		for (const c of 'asdfjkl') expect(first.get(c)).toBe('new');
		const seen = new Set<string>();
		PARTS.forEach((_, i) => {
			for (const [k, s] of partKeys(i)) {
				if (s !== 'new') continue;
				expect(seen.has(k), k).toBe(false);
				seen.add(k);
			}
		});
	});

	it('counts every lesson once across the parts', () => {
		expect(PARTS.reduce((n, p) => n + partLessons(p), 0)).toBe(LESSONS.length);
	});
});
