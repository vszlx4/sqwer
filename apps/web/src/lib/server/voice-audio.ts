/*
 * Audio helpers for spoken words. Kokoro garbles words said on their own (an extra "a" before them, clipped
 * sounds), so each word is spoken after a carrier ("Okay... little.") and cut out at the pause that follows it.
 */

const HOP = 240; // 10 ms at 24 kHz

/** RMS level per 10 ms frame. */
function levels(samples: Float32Array): number[] {
	const out: number[] = [];
	for (let f = 0; f + 1 <= samples.length / HOP; f++) {
		let sum = 0;
		for (let i = f * HOP; i < (f + 1) * HOP; i++) sum += samples[i]! * samples[i]!;
		out.push(Math.sqrt(sum / HOP));
	}
	return out;
}

/**
 * The audio after the carrier: the end of the first pause of at least `minPause` frames once speech has run for
 * `minSpeech` frames. Null when there is no such pause.
 */
export function afterCarrier(samples: Float32Array, minSpeech = 20, minPause = 8): Float32Array | null {
	const rms = levels(samples);
	const floor = Math.max(...rms) * 0.03;
	let f = 0;
	while (f < rms.length && rms[f]! < floor) f++;
	f += minSpeech;
	for (let run = 0; f < rms.length; f++) {
		if (rms[f]! < floor) run++;
		else if (run >= minPause) return samples.slice(Math.max(0, (f - 2) * HOP));
		else run = 0;
	}
	return null;
}

/** Cuts silence at both ends, keeping `pad` seconds, with 5 ms fades so the cut does not click. */
export function trimSilence(samples: Float32Array, rate = 24000, pad = 0.03): Float32Array {
	const floor = Math.max(...samples.map(Math.abs)) * 0.02;
	let start = 0;
	let end = samples.length - 1;
	while (start < end && Math.abs(samples[start]!) < floor) start++;
	while (end > start && Math.abs(samples[end]!) < floor) end--;
	const p = Math.round(rate * pad);
	const out = samples.slice(Math.max(0, start - p), Math.min(samples.length, end + p));
	const fade = Math.min(Math.round(rate * 0.005), out.length >> 1);
	for (let i = 0; i < fade; i++) {
		out[i]! *= i / fade;
		out[out.length - 1 - i]! *= i / fade;
	}
	return out;
}

/** 16-bit mono PCM WAV. */
export function toWav(samples: Float32Array, rate = 24000): Buffer {
	const data = samples.length * 2;
	const b = Buffer.alloc(44 + data);
	b.write('RIFF', 0);
	b.writeUInt32LE(36 + data, 4);
	b.write('WAVEfmt ', 8);
	b.writeUInt32LE(16, 16);
	b.writeUInt16LE(1, 20);
	b.writeUInt16LE(1, 22);
	b.writeUInt32LE(rate, 24);
	b.writeUInt32LE(rate * 2, 28);
	b.writeUInt16LE(2, 32);
	b.writeUInt16LE(16, 34);
	b.write('data', 36);
	b.writeUInt32LE(data, 40);
	for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i]!)) * 32767), 44 + i * 2);
	return b;
}

/**
 * Slower speech at the same pitch (WSOLA): windows read `factor` times further apart than they are written, each
 * shifted up to 10 ms to line up with the previous window's waveform. `factor` above 1 lengthens.
 */
export function stretch(samples: Float32Array, factor: number, rate = 24000): Float32Array {
	const win = 2 * Math.round(rate * 0.0125); // 25 ms, even
	const hop = win / 2; // written; Hann at half overlap sums to one
	const read = hop / factor;
	const tol = Math.round(rate * 0.01);
	const outLen = Math.round(samples.length * factor);
	const out = new Float32Array(outLen + win);
	const sum = new Float32Array(outLen + win);
	const hann = Float32Array.from({ length: win }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / win));
	const at = (i: number) => (i >= 0 && i < samples.length ? samples[i]! : 0);
	let prev = 0; // input start of the last window written
	for (let k = 0; k * hop < outLen; k++) {
		let pos = Math.round(k * read);
		if (k > 0) {
			// Best match for the natural continuation of the last window over its overlap.
			const want = prev + hop;
			let best = -Infinity;
			let bestPos = pos;
			for (let d = -tol; d <= tol; d++) {
				const p = pos + d;
				let c = 0;
				for (let i = 0; i < hop; i += 2) c += at(p + i) * at(want + i);
				if (c > best) (best = c), (bestPos = p);
			}
			pos = bestPos;
		}
		const o = k * hop;
		for (let i = 0; i < win; i++) {
			out[o + i]! += at(pos + i) * hann[i]!;
			sum[o + i]! += hann[i]!;
		}
		prev = pos;
	}
	// Ends covered by one half window only: divide out the window there.
	for (let i = 0; i < outLen; i++) if (sum[i]! > 0.1) out[i]! /= sum[i]!;
	return out.slice(0, outLen);
}
