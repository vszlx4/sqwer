/* Clips as small mono MP3s: half the model's rate (44.1 → 22.05 kHz, plenty for one spoken word), 24 kbps. */

import { Mp3Encoder } from '@breezystack/lamejs';

export const MP3_RATE = 22050;
export const MP3_KBPS = 24;

/** Low-pass taps for halving the rate: windowed sinc at a quarter of the input rate. */
const TAPS = (() => {
	const n = 31;
	const mid = (n - 1) / 2;
	const taps = Array.from({ length: n }, (_, i) => {
		const x = i - mid;
		const sinc = x === 0 ? 0.5 : Math.sin(Math.PI * 0.5 * x) / (Math.PI * x);
		const blackman = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (n - 1));
		return sinc * blackman;
	});
	const sum = taps.reduce((a, b) => a + b, 0);
	return taps.map((t) => t / sum);
})();

/** Every other sample after a low-pass filter, so nothing above the new Nyquist folds back. */
export function halveRate(samples: Float32Array): Float32Array {
	const mid = (TAPS.length - 1) / 2;
	const out = new Float32Array(Math.ceil(samples.length / 2));
	for (let o = 0; o < out.length; o++) {
		const c = o * 2;
		let acc = 0;
		for (let k = 0; k < TAPS.length; k++) {
			const i = c + k - mid;
			if (i >= 0 && i < samples.length) acc += samples[i]! * TAPS[k]!;
		}
		out[o] = acc;
	}
	return out;
}

/** 16-bit PCM, clipped. */
export function toPcm16(samples: Float32Array): Int16Array {
	const out = new Int16Array(samples.length);
	for (let i = 0; i < samples.length; i++) out[i] = Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767);
	return out;
}

/** MP3 of mono samples at MP3_RATE. */
export function encodeMp3(samples: Float32Array): Uint8Array {
	const enc = new Mp3Encoder(1, MP3_RATE, MP3_KBPS);
	const pcm = toPcm16(samples);
	const parts: Uint8Array[] = [];
	const block = 1152;
	for (let i = 0; i < pcm.length; i += block) parts.push(enc.encodeBuffer(pcm.subarray(i, i + block)));
	parts.push(enc.flush());
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
}
