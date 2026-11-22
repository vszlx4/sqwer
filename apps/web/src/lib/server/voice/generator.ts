/*
 * Makes the missing Supertonic clips of the chosen sets, normal then slow for each word, each word once even when
 * two sets share it. One generator at a time (lock file with its pid); it stops after the current clip when told to,
 * and starts where it left off next time, since finished clips are on disk. Progress, in words, goes to state.json
 * for the screens.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SPEEDS, clipPath, clipsDir, fingerprint, type Speed } from './clips.ts';
import type { VoiceSet } from './manifest.ts';
import { writeAtomic } from './supertonic.ts';

/** Makes one clip: MP3 bytes for a word at a speed. */
export type ClipMaker = (word: string, speed: Speed, fp: string) => Promise<Uint8Array>;

/** A set's words with both clips made, of all its words. */
export interface SetProgress {
	id: string;
	name: string;
	ready: number;
	words: number;
}

export interface GeneratorState {
	running: boolean;
	/** Words with both clips made, and words wanted, over the chosen sets (each word once). */
	ready: number;
	words: number;
	/** Clips still to make. */
	left: number;
	sets: SetProgress[];
	/** Wall time per clip, rests included, over recent clips: what the time left is based on. */
	msPerClip: number | null;
	word: string | null;
	/** The set the current word is made for. */
	making: string | null;
	error: string | null;
	startedAt?: string;
	/** The chosen sets and clip format this run covered (runKey). */
	key?: string;
	/** Every clip of those sets is made. */
	complete?: boolean;
	/** The last run stopped at the disk limit (`limit` clips). */
	full?: boolean;
	limit?: number | null;
	/** On battery with making on battery turned off: waiting for the charger. */
	waiting?: 'battery' | null;
	/** Model download in progress, before the first clip. */
	downloading?: { received: number; total: number } | null;
	updatedAt: string;
}

/** What a finished run stands for: the chosen sets in order and the clip format. */
export const runKey = (sets: readonly string[]) => `${fingerprint('a', 'normal')}:${sets.join(',')}`;

const SPEED_IDS = Object.keys(SPEEDS) as Speed[];

/** Each word of the sets once, in making order, with the sets that hold it. */
function plan(sets: readonly VoiceSet[]): { word: string; set: number; owners: number[] }[] {
	const by = new Map<string, { word: string; set: number; owners: number[] }>();
	for (const [i, s] of sets.entries()) {
		for (const word of s.words) {
			const hit = by.get(word);
			if (hit) {
				if (hit.owners.at(-1) !== i) hit.owners.push(i);
			} else by.set(word, { word, set: i, owners: [i] });
		}
	}
	return [...by.values()];
}

const lockFile = (voiceDir: string) => path.join(clipsDir(voiceDir), 'generator.lock');
export const stateFile = (voiceDir: string) => path.join(clipsDir(voiceDir), 'state.json');

const alive = (pid: number) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch (e) {
		return (e as NodeJS.ErrnoException).code === 'EPERM';
	}
};

/** Whether another live process holds the generator lock. */
export function isLocked(voiceDir: string, pid = process.pid): boolean {
	try {
		const holder = Number(readFileSync(lockFile(voiceDir), 'utf8'));
		return !!holder && holder !== pid && alive(holder);
	} catch {
		return false;
	}
}

/** Takes the lock, or returns false when another live generator holds it. A lock left by a dead process is taken over. */
export async function takeLock(voiceDir: string, pid = process.pid): Promise<boolean> {
	const file = lockFile(voiceDir);
	await mkdir(path.dirname(file), { recursive: true });
	try {
		await writeFile(file, String(pid), { flag: 'wx' });
		return true;
	} catch {
		const holder = Number(readFileSync(file, 'utf8'));
		if (holder && holder !== pid && alive(holder)) return false;
		await writeFile(file, String(pid));
		return true;
	}
}

export async function releaseLock(voiceDir: string, pid = process.pid): Promise<void> {
	const file = lockFile(voiceDir);
	if (existsSync(file) && Number(readFileSync(file, 'utf8')) === pid) await rm(file, { force: true });
}

export function readState(voiceDir: string): GeneratorState | null {
	try {
		return JSON.parse(readFileSync(stateFile(voiceDir), 'utf8')) as GeneratorState;
	} catch {
		return null;
	}
}

/** Saves the generator state for the screens. */
export async function writeState(voiceDir: string, state: GeneratorState): Promise<void> {
	await writeAtomic(stateFile(voiceDir), new TextEncoder().encode(JSON.stringify(state)));
}

/** Fingerprints of the finished clips on disk, from one listing per folder (far quicker than a check per clip). */
export function listClips(voiceDir: string): Set<string> {
	const root = clipsDir(voiceDir);
	const out = new Set<string>();
	if (!existsSync(root)) return out;
	for (const sub of readdirSync(root, { withFileTypes: true })) {
		if (!sub.isDirectory()) continue;
		for (const f of readdirSync(path.join(root, sub.name))) if (f.endsWith('.mp3')) out.add(f.slice(0, -4));
	}
	return out;
}

/** Words of each set with both clips on disk. */
export function countReady(sets: readonly VoiceSet[], have: ReadonlySet<string>): SetProgress[] {
	return sets.map((s) => {
		let ready = 0;
		if (have.size) for (const w of s.words) if (SPEED_IDS.every((sp) => have.has(fingerprint(w, sp)))) ready++;
		return { id: s.id, name: s.name, ready, words: s.words.length };
	});
}

/** Removes clips no set wants any more (an older clip format, a word dropped from a list). Returns how many. */
export async function sweepUnwanted(voiceDir: string, wanted: (fp: string) => boolean, have = listClips(voiceDir)): Promise<number> {
	let n = 0;
	for (const fp of have) {
		if (wanted(fp)) continue;
		await rm(clipPath(voiceDir, fp), { force: true });
		n++;
	}
	return n;
}

/** Removes temporary files left by a crash. */
export async function sweepPartFiles(voiceDir: string): Promise<number> {
	const root = clipsDir(voiceDir);
	if (!existsSync(root)) return 0;
	let n = 0;
	for (const sub of await readdir(root, { withFileTypes: true })) {
		if (!sub.isDirectory()) continue;
		for (const f of await readdir(path.join(root, sub.name))) {
			if (f.endsWith('.part')) {
				await rm(path.join(root, sub.name, f), { force: true });
				n++;
			}
		}
	}
	return n;
}

export interface RunOptions {
	voiceDir: string;
	/** The chosen sets, in making order, each with all its words. */
	sets: readonly VoiceSet[];
	make: ClipMaker;
	/** Checked before each clip: 'go', 'stop' (after the current clip), or 'battery' (wait for the charger). */
	keepGoing: () => 'go' | 'stop' | 'battery' | Promise<'go' | 'stop' | 'battery'>;
	onProgress?: (state: GeneratorState) => void;
	/** Rest after each clip, as a share of the time it took (1: rest as long as it worked). */
	rest?: number;
	/** How long to wait between checks for the charger. */
	waitMs?: number;
	/** What this run stands for (runKey), saved with the state. */
	key?: string;
	/** Clips on disk (any set) at which to stop: the disk limit. */
	maxClips?: number | null;
}

export type RunResult = 'done' | 'stopped' | 'locked' | 'full';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Makes every missing clip of the chosen sets, or until told to stop. */
export async function runGenerator(o: RunOptions): Promise<RunResult> {
	if (!(await takeLock(o.voiceDir))) return 'locked';
	const have = listClips(o.voiceDir);
	const words = plan(o.sets);
	const sets: SetProgress[] = o.sets.map((s) => ({ id: s.id, name: s.name, ready: 0, words: s.words.length }));
	let ready = 0;
	let left = 0;
	const todo: { word: string; set: number; owners: number[]; missing: { speed: Speed; fp: string }[] }[] = [];
	for (const w of words) {
		const missing = SPEED_IDS.map((speed) => ({ speed, fp: fingerprint(w.word, speed) })).filter((c) => !have.has(c.fp));
		if (missing.length) {
			todo.push({ ...w, missing });
			left += missing.length;
		} else {
			ready++;
			for (const i of w.owners) sets[i]!.ready++;
		}
	}
	const recent: number[] = [];
	// The last known pace stands until new clips give a fresh one.
	const before = readState(o.voiceDir)?.msPerClip ?? null;
	const state: GeneratorState = {
		running: true,
		ready,
		words: words.length,
		left,
		sets,
		msPerClip: before,
		word: null,
		making: null,
		error: null,
		startedAt: new Date().toISOString(),
		key: o.key,
		complete: false,
		full: false,
		limit: o.maxClips ?? null,
		waiting: null,
		updatedAt: ''
	};
	let savedAt = 0;
	const save = async (force = false) => {
		state.ready = ready;
		state.left = left;
		state.msPerClip = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : before;
		state.updatedAt = new Date().toISOString();
		o.onProgress?.(state);
		if (!force && Date.now() - savedAt < 1500) return;
		savedAt = Date.now();
		await writeState(o.voiceDir, state);
	};
	let result: RunResult = 'done';
	try {
		await sweepPartFiles(o.voiceDir);
		await save(true);
		outer: for (const w of todo) {
			for (const c of w.missing) {
				for (;;) {
					const go = await o.keepGoing();
					if (go === 'go') break;
					if (go === 'stop') {
						result = 'stopped';
						break outer;
					}
					if (state.waiting !== 'battery') {
						state.waiting = 'battery';
						state.word = null;
						await save(true);
					}
					await sleep(o.waitMs ?? 30_000);
				}
				if (state.waiting) {
					state.waiting = null;
					await save(true);
				}
				if (o.maxClips != null && have.size >= o.maxClips) {
					result = 'full';
					state.full = true;
					break outer;
				}
				state.word = w.word;
				state.making = o.sets[w.set]!.id;
				const t = performance.now();
				await writeAtomic(clipPath(o.voiceDir, c.fp), await o.make(w.word, c.speed, c.fp));
				have.add(c.fp);
				left--;
				if (o.rest) await sleep((performance.now() - t) * o.rest);
				recent.push(performance.now() - t);
				if (recent.length > 50) recent.shift();
				await save();
			}
			ready++;
			for (const i of w.owners) sets[i]!.ready++;
		}
		state.complete = result === 'done';
	} catch (e) {
		state.error = e instanceof Error ? e.message : String(e);
		throw e;
	} finally {
		state.running = false;
		state.word = null;
		state.making = null;
		state.waiting = null;
		await save(true).catch(() => {});
		await releaseLock(o.voiceDir);
	}
	return result;
}
