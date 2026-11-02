/*
 * Natural voice (Kokoro) for Listen and type. Opt-in: the model is downloaded once on request and then kept in
 * Cache Storage; later visits load it from there without asking. Words are synthesised on the device.
 */

import { CACHE_NAME, MODEL_KEY, type FromWorker, type ToWorker } from './protocol.ts';

export type VoiceStatus = 'off' | 'loading' | 'ready' | 'failed';

class Voice {
	status = $state<VoiceStatus>('off');
	/** Download progress of the model, 0 to 1. */
	progress = $state(0);

	#worker: Worker | null = null;
	#next = 0;
	#waiting = new Map<number, { resolve: (b: AudioBuffer | null) => void }>();
	#clips = new Map<string, Promise<AudioBuffer | null>>();
	#ctx: AudioContext | null = null;
	#playing: AudioBufferSourceNode | null = null;
	/** Bumped by every say() and stop(), so a clip that arrives late does not play over a newer one. */
	#turn = 0;

	get supported(): boolean {
		return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && typeof AudioContext !== 'undefined';
	}

	/** Whether the model was downloaded on an earlier visit. */
	async cached(): Promise<boolean> {
		if (!this.supported || typeof caches === 'undefined') return false;
		try {
			return !!(await (await caches.open(CACHE_NAME)).match(MODEL_KEY));
		} catch {
			return false;
		}
	}

	/** Starts the worker and loads the model; safe to call more than once. */
	load() {
		if (!this.supported || this.status === 'loading' || this.status === 'ready') return;
		this.status = 'loading';
		this.progress = 0;
		this.#worker ??= this.#spawn();
		this.#send({ type: 'load' });
	}

	#spawn(): Worker {
		const w = new Worker(new URL('./kokoro.worker.ts', import.meta.url), { type: 'module' });
		w.onmessage = (e: MessageEvent<FromWorker>) => this.#receive(e.data);
		w.onerror = () => this.#fail();
		return w;
	}

	#send(m: ToWorker) {
		this.#worker?.postMessage(m);
	}

	#receive(m: FromWorker) {
		if (m.type === 'progress') this.progress = m.total ? m.loaded / m.total : 0;
		else if (m.type === 'ready') {
			this.status = 'ready';
			this.progress = 1;
		} else if (m.type === 'audio') {
			const ctx = this.#audio();
			let buffer: AudioBuffer | null = null;
			if (ctx && m.samples.length) {
				buffer = ctx.createBuffer(1, m.samples.length, m.rate);
				buffer.copyToChannel(m.samples as Float32Array<ArrayBuffer>, 0);
			}
			this.#settle(m.id, buffer);
		} else if (m.type === 'error') {
			if (m.id === undefined) this.#fail();
			else this.#settle(m.id, null);
		}
	}

	#settle(id: number, buffer: AudioBuffer | null) {
		this.#waiting.get(id)?.resolve(buffer);
		this.#waiting.delete(id);
	}

	#fail() {
		this.status = 'failed';
		for (const id of [...this.#waiting.keys()]) this.#settle(id, null);
		this.#clips.clear();
		this.#worker?.terminate();
		this.#worker = null;
	}

	#audio(): AudioContext | null {
		if (typeof AudioContext === 'undefined') return null;
		this.#ctx ??= new AudioContext();
		if (this.#ctx.state === 'suspended') void this.#ctx.resume();
		return this.#ctx;
	}

	/** Audio for a word; synthesised once, then reused. Null when the voice cannot say it. */
	clip(text: string, speed = 0.9): Promise<AudioBuffer | null> {
		const key = `${speed}|${text}`;
		let clip = this.#clips.get(key);
		if (!clip) {
			if (this.status !== 'ready') return Promise.resolve(null);
			const id = this.#next++;
			clip = new Promise((resolve) => this.#waiting.set(id, { resolve }));
			this.#send({ type: 'speak', id, text, speed });
			this.#clips.set(key, clip);
		}
		return clip;
	}

	/** Synthesises words ahead of time, in order, so each plays without a wait. */
	prepare(words: readonly string[]) {
		for (const w of words) void this.clip(w);
	}

	/** Plays a word; false when the natural voice could not say it. */
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
