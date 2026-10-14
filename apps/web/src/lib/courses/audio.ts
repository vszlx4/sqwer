/*
 * Sound for the course activities: short synthesised tones for the rhythm game and
 * the browser's own speech synthesis for dictation. Nothing is downloaded or recorded.
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

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** Speaks a word with an English voice where one is available. */
export function speak(text: string, rate = 0.85): Promise<void> {
	return new Promise((resolve) => {
		if (!canSpeak()) return resolve();
		speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		const voices = speechSynthesis.getVoices();
		u.voice = voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
		u.lang = u.voice?.lang ?? 'en-GB';
		u.rate = rate;
		u.onend = () => resolve();
		u.onerror = () => resolve();
		speechSynthesis.speak(u);
	});
}
