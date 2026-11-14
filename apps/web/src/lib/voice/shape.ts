/* A clip's outline for the Listen and type waveform: the spoken span only, as bar heights. */

export interface ClipShape {
	bars: number[];
	/** Speech start and end, as fractions of the clip. */
	from: number;
	to: number;
}

/** Slices measured before the quiet ends are cut; the spoken span is then resampled into `bars`. */
const FINE = 240;
/** A slice quieter than this share of the loudest one counts as silence at the ends. */
const QUIET = 0.08;

/** The spoken span of `data` as `bars` heights from 0.1 to 1, with where speech starts and ends. */
export function outline(data: Float32Array, bars: number): ClipShape {
	const size = Math.max(1, Math.floor(data.length / FINE));
	const n = Math.max(1, Math.floor(data.length / size));
	const rms = Array.from({ length: n }, (_, k) => {
		let sum = 0;
		const from = k * size;
		const to = Math.min(data.length, from + size);
		for (let i = from; i < to; i++) sum += data[i] * data[i];
		return Math.sqrt(sum / Math.max(1, to - from));
	});
	const top = Math.max(...rms) || 1;
	let first = rms.findIndex((v) => v >= top * QUIET);
	let last = rms.length - 1 - [...rms].reverse().findIndex((v) => v >= top * QUIET);
	if (first < 0) [first, last] = [0, n - 1];
	const span = last - first + 1;
	const heights = Array.from({ length: bars }, (_, b) => {
		const a = first + Math.floor((b * span) / bars);
		const z = Math.max(a + 1, first + Math.floor(((b + 1) * span) / bars));
		let peak = 0;
		for (let k = a; k < z; k++) peak = Math.max(peak, rms[k]);
		// Square root lifts quiet consonants so the word's outline reads.
		return Math.max(0.1, Math.sqrt(peak / top));
	});
	return { bars: heights, from: first / n, to: (last + 1) / n };
}

