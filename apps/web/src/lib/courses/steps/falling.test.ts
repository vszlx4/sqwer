import { describe, expect, it } from 'vitest';
import { fallScale, HEIGHT } from './falling.ts';

describe('falling field', () => {
	it('falls as fast in time at any height: the lesson height is 1, taller scales by the distance', () => {
		expect(fallScale(HEIGHT)).toBe(1);
		expect(fallScale(300)).toBe(1);
		const d = (h: number) => h - 46 + 40;
		expect(fallScale(800)).toBeCloseTo(d(800) / d(HEIGHT));
		// Time to land = distance / (speed × scale), the same for both fields.
		expect(d(800) / fallScale(800)).toBeCloseTo(d(HEIGHT));
	});
});
