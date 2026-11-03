/*
 * Natural voice for Listen and type: one clip per word, rendered by our server (lib/server/voice.ts). When a
 * clip cannot be fetched or decoded, speak() in audio.ts falls back to the device's own voices.
 */

import { clipUrl, isSpeakable } from './clip.ts';

class Voice {
	#clips = new Map<string, Promise<AudioBuffer | null>>();
	#ctx: AudioContext | null = null;
	#playing: AudioBufferSourceNode | null = null;
	/** Bumped by every say() and stop(), so a clip that arrives late does not play over a newer one. */
	#turn = 0;

	get supported(): boolean {
		return typeof AudioContext !== 'undefined' && typeof fetch !== 'undefined';
	}

	#audio(): AudioContext | null {
		if (!this.supported) return null;
		this.#ctx ??= new AudioContext();
		if (this.#ctx.state === 'suspended') void this.#ctx.resume();
		return this.#ctx;
	}

	/** Audio for a word; fetched once, then reused. Null when there is no clip. */
	clip(text: string): Promise<AudioBuffer | null> {
		const word = text.trim().toLowerCase();
		if (!this.supported || !isSpeakable(word)) return Promise.resolve(null);
		let clip = this.#clips.get(word);
		if (!clip) {
			clip = (async () => {
				try {
					const res = await fetch(clipUrl(word));
					if (!res.ok) return null;
					return await this.#audio()!.decodeAudioData(await res.arrayBuffer());
				} catch {
					return null;
				}
			})();
			// A failed fetch can be retried on the next play.
			void clip.then((b) => b ?? this.#clips.delete(word));
			this.#clips.set(word, clip);
		}
		return clip;
	}

	/** Fetches words ahead of time, so each plays without a wait. */
	prepare(words: readonly string[]) {
		for (const w of words) void this.clip(w);
	}

	/** Plays a word; false when there is no clip for it. */
	async say(text: string): Promise<boolean> {
		const turn = ++this.#turn;
		const buffer = await this.clip(text);
		const ctx = this.#audio();
		if (!buffer || !ctx) return false;
		if (turn !== this.#turn) return true;
		this.#halt();
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(ctx.destination);
		this.#playing = source;
		await new Promise<void>((resolve) => {
			source.onended = () => resolve();
			source.start();
		});
		if (this.#playing === source) this.#playing = null;
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
	}
}

export const voice = new Voice();
