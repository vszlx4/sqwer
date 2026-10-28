/* Course audio: synthesised tones (Echo) and on-device speech synthesis. No network. */

import { DEFAULT_LOCALE } from '#lib/i18n/locales.ts';

let context: AudioContext | null = null;
let output: AudioNode | null = null;

/** Master chain: low-pass filter, then a compressor against stacked peaks. */
function audio(): { ctx: AudioContext; out: AudioNode } | null {
	if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
	if (!context) {
		context = new AudioContext();
		const filter = context.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 2200;
		const limiter = context.createDynamicsCompressor();
		limiter.threshold.value = -24;
		limiter.ratio.value = 8;
		const master = context.createGain();
		master.gain.value = 0.6;
		filter.connect(limiter).connect(master).connect(context.destination);
		output = filter;
	}
	if (context.state === 'suspended') void context.resume();
	return { ctx: context, out: output! };
}

/** A soft, piano-like tone. */
export function tone(frequency: number, duration = 0.35, volume = 0.08) {
	const a = audio();
	if (!a) return;
	const { ctx, out } = a;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const overtone = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'triangle';
	overtone.type = 'sine';
	osc.frequency.value = frequency;
	overtone.frequency.value = frequency * 2;
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(volume, now + 0.015);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
	// The overtone adds warmth at a quarter of the level, not brightness.
	const soft = ctx.createGain();
	soft.gain.value = 0.25;
	osc.connect(gain);
	overtone.connect(soft).connect(gain);
	gain.connect(out);
	osc.start(now);
	overtone.start(now);
	osc.stop(now + duration);
	overtone.stop(now + duration);
}

/** Notes of a pentatonic scale, which sound pleasant in any order. */
export const LANE_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** English voices that run on the device itself. */
function localVoices(): SpeechSynthesisVoice[] {
	if (!speechAvailable()) return [];
	return speechSynthesis.getVoices().filter((v) => v.localService && v.lang.toLowerCase().startsWith('en'));
}

/** On-device speech available. Voices can load late; recheck after `voiceschanged`. */
export const canSpeak = () => localVoices().length > 0;

/** Resolves once the browser has listed its voices, or after a short wait. */
export function voicesReady(): Promise<void> {
	if (!speechAvailable() || speechSynthesis.getVoices().length) return Promise.resolve();
	return new Promise((resolve) => {
		const done = () => resolve();
		speechSynthesis.addEventListener('voiceschanged', done, { once: true });
		setTimeout(done, 1500);
	});
}

/** Speaks a word with an English voice where one is available. */
export function speak(text: string, rate = 0.85): Promise<void> {
	return new Promise((resolve) => {
		if (!canSpeak()) return resolve();
		speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		// Only voices built into the device: online voices would send the text to the browser's vendor.
		const voices = localVoices();
		u.voice = voices.find((v) => v.lang === DEFAULT_LOCALE) ?? voices[0] ?? null;
		if (!u.voice) return resolve();
		u.lang = u.voice?.lang ?? DEFAULT_LOCALE;
		u.rate = rate;
		u.onend = () => resolve();
		u.onerror = () => resolve();
		speechSynthesis.speak(u);
	});
}
