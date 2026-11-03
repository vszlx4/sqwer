import { describe, expect, it } from 'vitest';
import { afterCarrier, toWav, trimSilence } from './voice-audio.ts';

const RATE = 24000;
/** Silence and tones laid end to end: [seconds, amplitude][]. */
function track(parts: [number, number][]): Float32Array {
	const out: number[] = [];
	for (const [s, amp] of parts) for (let i = 0; i < s * RATE; i++) out.push(amp * Math.sin(i / 8));
	return Float32Array.from(out);
}

describe('afterCarrier', () => {
	it('keeps what follows the pause after the carrier', () => {
		// lead silence, carrier, 200 ms pause, word, tail
		const a = track([[0.4, 0], [0.5, 0.5], [0.2, 0], [0.4, 0.8], [0.3, 0]]);
		const cut = afterCarrier(a)!;
		expect(cut).not.toBeNull();
		expect(cut.length / RATE).toBeGreaterThan(0.7);
		expect(cut.length / RATE).toBeLessThan(0.75);
	});

	it('ignores short gaps inside the carrier', () => {
		const a = track([[0.3, 0], [0.25, 0.5], [0.04, 0], [0.25, 0.5], [0.2, 0], [0.4, 0.8]]);
		expect(afterCarrier(a)!.length / RATE).toBeLessThan(0.45);
	});

	it('reports a missing pause', () => {
		expect(afterCarrier(track([[0.3, 0], [1, 0.5]]))).toBeNull();
	});
});

describe('trimSilence and toWav', () => {
	it('trims both ends to a short pad and fades the edges', () => {
		const out = trimSilence(track([[0.5, 0], [0.3, 0.5], [0.5, 0]]));
		expect(out.length / RATE).toBeCloseTo(0.36, 1);
		expect(out[0]).toBe(0);
	});

	it('writes a 16-bit mono header', () => {
		const wav = toWav(new Float32Array([0, 0.5, -1]));
		expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
		expect(wav.readUInt32LE(24)).toBe(RATE);
		expect(wav.readUInt32LE(40)).toBe(6);
		expect(wav.readInt16LE(48)).toBe(-32767);
	});
});
