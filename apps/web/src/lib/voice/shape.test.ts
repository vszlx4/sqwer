import { describe, expect, it } from 'vitest';
import { outline } from './shape.ts';

/** Silence, a tone at `level`, silence: lengths in samples. */
function clip(...parts: [number, number][]): Float32Array {
	const out: number[] = [];
	for (const [len, level] of parts) for (let i = 0; i < len; i++) out.push(level * (i % 2 ? 1 : -1));
	return new Float32Array(out);
}

describe('outline', () => {
	it('cuts silence at both ends and keeps the spoken span', () => {
		const s = outline(clip([2400, 0], [4800, 0.5], [4800, 0]), 16);
		expect(s.bars).toHaveLength(16);
		expect(s.from).toBeCloseTo(0.2, 1);
		expect(s.to).toBeCloseTo(0.6, 1);
		expect(Math.min(...s.bars)).toBeGreaterThan(0.9);
	});
	it('scales quiet parts by the square root and keeps a floor', () => {
		const s = outline(clip([4800, 1], [4800, 0.25]), 2);
		expect(s.bars[0]).toBeCloseTo(1, 2);
		expect(s.bars[1]).toBeCloseTo(0.5, 2);
		expect(outline(clip([4800, 0]), 4)).toEqual({ bars: [0.1, 0.1, 0.1, 0.1], from: 0, to: 1 });
	});
});
