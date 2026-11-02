import { describe, expect, it } from 'vitest';
import { pace, PACE } from './pace.ts';

describe('takeover pace', () => {
	it('runs quick through the fill, held back through the line, quicker through the float', () => {
		expect(pace(0.2)).toBe(3);
		expect(pace(0.6)).toBe(0.32);
		expect(pace(0.93)).toBe(2);
	});

	it('is normal outside the track and continuous inside it', () => {
		expect(pace(-0.1)).toBe(1);
		expect(pace(1.2)).toBe(1);
		expect(pace(1)).toBe(1);
		for (let p = 0; p < 1; p += 0.001) expect(Math.abs(pace(p + 0.001) - pace(p))).toBeLessThan(0.15);
	});

	it('keeps its points in order', () => {
		const xs = PACE.map(([x]) => x);
		expect(xs).toEqual([...xs].sort((a, b) => a - b));
		expect(xs[0]).toBe(0);
		expect(xs.at(-1)).toBe(1);
	});
});
