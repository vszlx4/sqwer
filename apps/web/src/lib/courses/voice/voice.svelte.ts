/*
 * Natural voice for Listen and type: one clip per word, rendered by our server (lib/server/voice.ts). When a
 * clip cannot be fetched or decoded, speak() in audio.ts falls back to the device's own voices.
 */

import { clipUrl, isSpeakable } from './clip.ts';

export type Speed = 'normal' | 'slow';

const VOLUME_KEY = 'sqwer:volume';

class Voice {
	#clips = new Map<string, Promise<AudioBuffer | null>>();
	#ctx: AudioContext | null = null;
	#gain: GainNode | null = null;
	#analyser: AnalyserNode | null = null;
	#samples: Float32Array<ArrayBuffer> | null = null;
	#playing: AudioBufferSourceNode | null = null;
	/** Volume from 0 to 1, kept on this device. */
	volume = $state(0.8);
	/** True while a clip plays. */
	speaking = $state(false);

	constructor() {
		if (typeof localStorage === 'undefined') return;
		try {
			const saved = localStorage.getItem(VOLUME_KEY);
			if (saved !== null && Number.isFinite(Number(saved))) this.volume = Math.min(1, Math.max(0, Number(saved)));
		} catch {
			// Storage unavailable: the default volume is used.
		}
	}

	setVolume(value: number) {
		this.volume = Math.min(1, Math.max(0, value));
		if (this.#gain) this.#gain.gain.value = this.volume;
		try {
			localStorage.setItem(VOLUME_KEY, String(this.volume));
		} catch {
			// Storage unavailable.
		}
	}

	/** Loudness of the playing clip, from 0 to 1; 0 when nothing plays. */
	level(): number {
		if (!this.#analyser || !this.#samples || !this.#playing) return 0;
		this.#analyser.getFloatTimeDomainData(this.#samples);
		let sum = 0;
		for (const v of this.#samples) sum += v * v;
		// Speech RMS sits around 0.05-0.3; scaled so a normal word fills most of the range.
		return Math.min(1, Math.sqrt(sum / this.#samples.length) * 4);
	}
	/** Bumped by every say() and stop(), so a clip that arrives late does not play over a newer one. */
	#turn = 0;

	get supported(): boolean {
		return typeof AudioContext !== 'undefined' && typeof fetch !== 'undefined';
	}

	#audio(): AudioContext | null {
		if (!this.supported) return null;
		if (!this.#ctx) {
			this.#ctx = new AudioContext();
			this.#gain = this.#ctx.createGain();
			this.#gain.gain.value = this.volume;
			this.#analyser = this.#ctx.createAnalyser();
			this.#analyser.fftSize = 512;
			this.#samples = new Float32Array(this.#analyser.fftSize);
			// Level is read before the volume, so the pill moves the same at any volume.
			this.#analyser.connect(this.#gain).connect(this.#ctx.destination);
		}
		if (this.#ctx.state === 'suspended') void this.#ctx.resume();
		return this.#ctx;
	}

	/** Audio for a word; fetched once, then reused. Null when there is no clip. */
	clip(text: string, speed: Speed = 'normal'): Promise<AudioBuffer | null> {
		const word = text.trim().toLowerCase();
		if (!this.supported || !isSpeakable(word)) return Promise.resolve(null);
		const key = `${speed}:${word}`;
		let clip = this.#clips.get(key);
		if (!clip) {
			clip = (async () => {
				try {
					const res = await fetch(clipUrl(word, speed));
					if (!res.ok) return null;
					return await this.#audio()!.decodeAudioData(await res.arrayBuffer());
				} catch {
					return null;
				}
			})();
			// A failed fetch can be retried on the next play.
			void clip.then((b) => b ?? this.#clips.delete(key));
			this.#clips.set(key, clip);
		}
		return clip;
	}

	/** Fetches words ahead of time, so each plays without a wait. */
	prepare(words: readonly string[]) {
		for (const w of words) void this.clip(w);
	}

	/** Plays a word; false when there is no clip for it. */
	async say(text: string, speed: Speed = 'normal'): Promise<boolean> {
		const turn = ++this.#turn;
		const buffer = await this.clip(text, speed);
		const ctx = this.#audio();
		if (!buffer || !ctx) return false;
		if (turn !== this.#turn) return true;
		this.#halt();
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(this.#analyser!);
		this.#playing = source;
		this.speaking = true;
		await new Promise<void>((resolve) => {
			source.onended = () => resolve();
			source.start();
		});
		if (this.#playing === source) {
			this.#playing = null;
			this.speaking = false;
		}
		return true;
	}

	stop() {
		this.#turn++;
		this.#halt();
	}

	#halt() {
		try {
			this.#playing?.stop();
		} catch {
			// Already ended.
		}
		this.#playing = null;
		this.speaking = false;
	}
}

export const voice = new Voice();
