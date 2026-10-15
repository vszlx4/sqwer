/*
 * Sound for the course activities: short synthesised tones for the rhythm game and
 * the device's own speech synthesis for dictation. Nothing is downloaded, recorded or sent anywhere.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
	if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
	context ??= new AudioContext();
	if (context.state === 'suspended') void context.resume();
	return context;
}

/** A soft, piano-like tone. */
export function tone(frequency: number, duration = 0.35, volume = 0.18) {
	const ctx = audio();
	if (!ctx) return;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const overtone = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'triangle';
	overtone.type = 'sine';
	osc.frequency.value = frequency;
	overtone.frequency.value = frequency * 2;
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(volume, now + 0.008);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
	osc.connect(gain);
	overtone.connect(gain);
	gain.connect(ctx.destination);
	osc.start(now);
	overtone.start(now);
	osc.stop(now + duration);
	overtone.stop(now + duration);
}

/** A quiet click for counting in. */
export function tick(accent = false) {
	tone(accent ? 1320 : 880, 0.06, accent ? 0.12 : 0.07);
}

/** Notes of a pentatonic scale, which sound pleasant in any order. */
export const LANE_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** English voices that run on the device itself. */
function localVoices(): SpeechSynthesisVoice[] {
	if (!speechAvailable()) return [];
	return speechSynthesis.getVoices().filter((v) => v.localService && v.lang.toLowerCase().startsWith('en'));
}

/**
 * Whether words can be spoken without sending them anywhere. Voices may load after the page;
 * call again once `voiceschanged` has fired.
 */
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
		u.voice = voices.find((v) => v.lang === 'en-GB') ?? voices[0] ?? null;
		if (!u.voice) return resolve();
		u.lang = u.voice?.lang ?? 'en-GB';
		u.rate = rate;
		u.onend = () => resolve();
		u.onerror = () => resolve();
		speechSynthesis.speak(u);
	});
}
