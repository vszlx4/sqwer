/*
 * The voice player for Listen and type (the page's instance: player.svelte.ts): one clip per word and speed from our server (routes/voice), decoded once and kept for
 * the last MEMORY words. Each word has a state the screens read. A word the server has no clip for is missing and is
 * not asked for again; a failed fetch is an error, retried only when the word is played again. Words are fetched
 * FETCHES at a time, the word in play at once, so it never waits behind the look-ahead in the browser or on the server.
 */

import { SvelteMap } from 'svelte/reactivity';
import { NEED_HEADER, NEED_RANK, clipUrl, isSpeakable, type Need, type Speed } from './clip.ts';
import { outline, type ClipShape } from './shape.ts';

export type { Speed } from './clip.ts';
export type WordState = 'loading' | 'ready' | 'playing' | 'missing' | 'error';
/** How a say() ended: heard to the end, cut short by another word or stop(), or not heard at all. */
export type Said = 'played' | 'stopped' | 'missing' | 'error';

/** Decoded words kept in memory; older ones are fetched again (from the browser's cache) when needed. */
export const MEMORY = 64;

/** Fade length for starts and stops, in seconds: long enough not to click, short enough not to be heard. */
export const FADE = 0.012;
/** Clips start this far ahead of the audio clock, so the first samples are never cut and the start time is exact. */
export const LEAD = 0.03;
/** Look-ahead requests at once. Browsers send six at a time to a server; the rest wait in the order they were made. */
export const FETCHES = 2;
/** A clip that has not arrived by then is an error; playing the word again asks once more. */
export const CLIP_TIMEOUT_MS = 45_000;
/** Longest wait for a suspended context to resume before a clip is scheduled anyway. */
const RESUME_MS = 400;

/** What the player needs from the page: the audio graph and the volume setting. */
export interface PlayerDeps {
	graph: () => { ctx: AudioContext; voice: GainNode } | null;
	volume: () => number;
	saveVolume: (value: number) => void;
}

const norm = (w: string) => w.trim().toLowerCase();

export class Player {
	/** Per word (normal speed): what the screens show. */
	readonly states = new SvelteMap<string, WordState>();
	readonly #deps: PlayerDeps;

	constructor(deps: PlayerDeps) {
		this.#deps = deps;
	}

	/** True while a clip plays (read from the word states, so screens follow it). */
	get speaking(): boolean {
		for (const s of this.states.values()) if (s === 'playing') return true;
		return false;
	}

	#version: Promise<string | null> | null = null;
	/** `${speed}:${word}` → decoded clip; Map order is the memory order, oldest first. #missing uses the same keys. */
	#clips = new Map<string, Promise<AudioBuffer | null>>();
	#missing = new Set<string>();
	#playing: { source: AudioBufferSourceNode; gain: GainNode; start: number; length: number } | null = null;
	/** Bumped by every say() and stop(), so a clip that arrives late does not play over a newer one. */
	#turn = 0;
	/** Clip requests on the way. */
	#sending = 0;
	/** Requests waiting for a turn, by key. */
	#queued = new Map<string, { need: Need; seq: number; go: () => void }>();
	/** How soon each word being fetched is wanted; say() can raise it before its request is queued. */
	#wanted = new Map<string, Need>();
	#seq = 0;

	get supported(): boolean {
		return typeof AudioContext !== 'undefined' && typeof fetch !== 'undefined';
	}

	get volume(): number {
		return this.#deps.volume();
	}

	setVolume(value: number) {
		const v = Math.min(1, Math.max(0, value));
		this.#deps.saveVolume(v);
		const g = this.#deps.graph();
		if (g) g.voice.gain.setTargetAtTime(v, g.ctx.currentTime, FADE);
	}

	state(word: string): WordState | undefined {
		return this.states.get(norm(word));
	}

	/** The voice settings version for clip addresses; asked once, again after the voice changed. */
	#versionOf(): Promise<string | null> {
		this.#version ??= fetch('/api/voice?version')
			.then((r) => (r.ok ? (r.json() as Promise<{ version: string }>) : null))
			.then((v) => v?.version ?? null)
			.catch(() => null)
			.then((v) => {
				if (!v) this.#version = null;
				return v;
			});
		return this.#version;
	}

	/** Waits for a turn to send; the word in play goes at once. Resolves with how soon it is wanted by then. */
	#turnToSend(key: string): Promise<Need> {
		const need = this.#wanted.get(key) ?? 'soon';
		if (need === 'now' || this.#sending < FETCHES) {
			this.#sending++;
			return Promise.resolve(need);
		}
		return new Promise((resolve) => {
			const entry = { need, seq: ++this.#seq, go: () => resolve(entry.need) };
			this.#queued.set(key, entry);
		});
	}

	/** A request finished: the most wanted of those waiting goes next. */
	#sent() {
		this.#sending--;
		let next: [string, { need: Need; seq: number; go: () => void }] | null = null;
		for (const e of this.#queued) if (!next || NEED_RANK[e[1].need] < NEED_RANK[next[1].need] || (e[1].need === next[1].need && e[1].seq < next[1].seq)) next = e;
		if (!next || this.#sending >= FETCHES) return;
		this.#queued.delete(next[0]);
		this.#sending++;
		next[1].go();
	}

	/** Moves a waiting request up; the word in play is sent at once. */
	#hurry(key: string, need: Need) {
		const was = this.#wanted.get(key);
		if (!was || NEED_RANK[need] >= NEED_RANK[was]) return;
		this.#wanted.set(key, need);
		const q = this.#queued.get(key);
		if (!q) return;
		q.need = need;
		if (need !== 'now') return;
		this.#queued.delete(key);
		this.#sending++;
		q.go();
	}

	async #fetch(word: string, speed: Speed, need: Need): Promise<ArrayBuffer | 'missing' | null> {
		const key = `${speed}:${word}`;
		this.#wanted.set(key, need);
		try {
			const version = await this.#versionOf();
			if (!version) return null;
			const sendAs = await this.#turnToSend(key);
			try {
				return await this.#get(version, word, speed, sendAs);
			} finally {
				this.#sent();
			}
		} finally {
			this.#wanted.delete(key);
		}
	}

	async #get(version: string, word: string, speed: Speed, need: Need, again = true): Promise<ArrayBuffer | 'missing' | null> {
		const abort = new AbortController();
		const timer = setTimeout(() => abort.abort(), CLIP_TIMEOUT_MS);
		try {
			const res = await fetch(clipUrl(version, word, speed), { headers: { [NEED_HEADER]: need }, signal: abort.signal });
			if (res.status === 410 && again) {
				this.#version = null;
				const next = await this.#versionOf();
				return next ? this.#get(next, word, speed, need, false) : null;
			}
			if (res.status === 404) return 'missing';
			return res.ok ? await res.arrayBuffer() : null;
		} catch {
			// Network failure or timeout.
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	/** A word's clip, fetched and decoded once. Null when there is none. `need`: how soon it plays (see clip.ts). */
	clip(text: string, speed: Speed = 'normal', need: Need = 'soon'): Promise<AudioBuffer | null> {
		const word = norm(text);
		const key = `${speed}:${word}`;
		const kept = this.#clips.get(key);
		if (kept) {
			// Used again: newest in memory, and sooner if it is still waiting to be asked for.
			this.#clips.delete(key);
			this.#clips.set(key, kept);
			this.#hurry(key, need);
			return kept;
		}
		if (!this.supported || !isSpeakable(word) || this.#missing.has(key)) {
			if (speed === 'normal') this.states.set(word, 'missing');
			return Promise.resolve(null);
		}
		const mark = (s: WordState) => speed === 'normal' && this.states.get(word) !== 'playing' && this.states.set(word, s);
		mark('loading');
		const clip = (async () => {
			const body = await this.#fetch(word, speed, need);
			if (body === 'missing') {
				this.#missing.add(key);
				if (speed === 'normal') this.states.set(word, 'missing');
				return null;
			}
			const g = this.#deps.graph();
			const buffer = body && g ? await g.ctx.decodeAudioData(body).catch(() => null) : null;
			mark(buffer ? 'ready' : 'error');
			return buffer;
		})();
		// A failed clip is not kept, so playing the word again tries once more.
		void clip.then((b) => {
			if (!b) this.#clips.delete(key);
		});
		this.#clips.set(key, clip);
		this.#forget();
		return clip;
	}

	/** Drops the oldest words past MEMORY; a word's speeds count as one word. */
	#forget() {
		const words = new Set([...this.#clips.keys()].map((k) => k.slice(k.indexOf(':') + 1)));
		for (const word of words) {
			if (words.size <= MEMORY) break;
			this.#clips.delete(`normal:${word}`);
			this.#clips.delete(`slow:${word}`);
			words.delete(word);
			if (this.states.get(word) === 'ready') this.states.delete(word);
		}
	}

	/** Fetches words ahead of time, so each plays without a wait. Slow clips come after every normal one. */
	prepare(words: readonly string[], speed: Speed = 'normal') {
		for (const w of words) void this.clip(w, speed, speed === 'slow' ? 'later' : 'soon');
	}

	/** Plays a word, fading in and out so it does not click. */
	async say(text: string, speed: Speed = 'normal'): Promise<Said> {
		const word = norm(text);
		const turn = ++this.#turn;
		const buffer = await this.clip(word, speed, 'now');
		const g = this.#deps.graph();
		if (!buffer || !g) return this.state(word) === 'missing' ? 'missing' : 'error';
		if (turn !== this.#turn) return 'stopped';
		this.#halt();
		const { ctx } = g;
		// A suspended clock stands still: start times taken from it would be stale once it runs, so wait for it.
		if (ctx.state === 'suspended') {
			await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, RESUME_MS))]);
			if (turn !== this.#turn) return 'stopped';
		}
		g.voice.gain.value = this.#deps.volume();
		const source = ctx.createBufferSource();
		const gain = ctx.createGain();
		source.buffer = buffer;
		source.connect(gain).connect(g.voice);
		const at = ctx.currentTime + LEAD;
		gain.gain.setValueAtTime(0, at);
		gain.gain.linearRampToValueAtTime(1, at + FADE);
		// Screens follow what is heard: the output's own delay (large on Bluetooth) moves the start the waveform uses.
		const heardAt = at + (ctx.outputLatency || ctx.baseLatency || 0);
		this.#playing = { source, gain, start: heardAt, length: buffer.duration };
		this.states.set(word, 'playing');
		const ended = await new Promise<boolean>((resolve) => {
			source.onended = () => resolve(this.#playing?.source === source);
			source.start(at);
		});
		if (this.#playing?.source === source) this.#playing = null;
		if (this.states.get(word) === 'playing') this.states.set(word, 'ready');
		return ended ? 'played' : 'stopped';
	}

	/** How far the playing clip has got, 0 to 1. 0 when nothing plays. */
	progress(): number {
		const g = this.#deps.graph();
		const p = this.#playing;
		if (!g || !p || !p.length) return 0;
		return Math.min(1, Math.max(0, (g.ctx.currentTime - p.start) / p.length));
	}

	/** The spoken part of a clip as `bars` heights; null when there is no clip. See shape.ts. */
	async shape(text: string, speed: Speed = 'normal', bars = 32): Promise<ClipShape | null> {
		const buffer = await this.clip(text, speed);
		return buffer ? outline(buffer.getChannelData(0), bars) : null;
	}

	stop() {
		this.#turn++;
		this.#halt();
	}

	/** Fades the playing clip out, then stops it. */
	#halt() {
		const p = this.#playing;
		this.#playing = null;
		if (!p) return;
		const g = this.#deps.graph();
		const now = g?.ctx.currentTime ?? 0;
		try {
			p.gain.gain.cancelScheduledValues(now);
			p.gain.gain.setValueAtTime(p.gain.gain.value, now);
			p.gain.gain.linearRampToValueAtTime(0, now + FADE);
			p.source.stop(now + FADE);
		} catch {
			// Already ended.
		}
		for (const [w, s] of this.states) if (s === 'playing') this.states.set(w, 'ready');
	}
}

