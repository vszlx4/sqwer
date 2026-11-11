/*
 * Makes the missing Supertonic clips, set by set, normal then slow for each word. One generator at a time (lock file
 * with its pid); it stops after the current word when the voice is switched back, paused or aborted, and starts
 * where it left off next time, since finished clips are on disk. Progress goes to state.json for the screens.
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SPEEDS, clipPath, clipsDir, fingerprint, type Speed } from './clips.ts';
import type { VoiceSet } from './manifest.ts';
import { writeAtomic } from './supertonic.ts';

/** Makes one clip: MP3 bytes for a word at a speed. */
export type ClipMaker = (word: string, speed: Speed, fp: string) => Promise<Uint8Array>;

export interface SetProgress {
	id: string;
	name: string;
	made: number;
	total: number;
}

export interface GeneratorState {
	running: boolean;
	/** Clips on disk and wanted, over all sets (two per word). */
	made: number;
	total: number;
	sets: SetProgress[];
	/** Rolling average of recent clips, in milliseconds. */
	msPerClip: number | null;
	word: string | null;
	error: string | null;
	updatedAt: string;
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

/** Clips on disk per set, by checking each wanted file. */
export function countMade(voiceDir: string, sets: readonly VoiceSet[]): SetProgress[] {
	return sets.map((s) => {
		let made = 0;
		for (const w of s.words) for (const sp of Object.keys(SPEEDS) as Speed[]) if (existsSync(clipPath(voiceDir, fingerprint(w, sp)))) made++;
		return { id: s.id, name: s.name, made, total: s.words.length * 2 };
	});
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
	sets: readonly VoiceSet[];
	make: ClipMaker;
	/** Checked before each clip; false stops after the current one. */
	keepGoing: () => boolean;
	/** Set ids to make first. */
	first?: readonly string[];
	onProgress?: (state: GeneratorState) => void;
	/** How often to save state.json, in clips. */
	saveEvery?: number;
}

export type RunResult = 'done' | 'stopped' | 'locked';

/** Makes every missing clip, or until told to stop. */
export async function runGenerator(o: RunOptions): Promise<RunResult> {
	if (!(await takeLock(o.voiceDir))) return 'locked';
	const order = [...o.sets].sort((a, b) => Number(o.first?.includes(b.id) ?? 0) - Number(o.first?.includes(a.id) ?? 0));
	const sets = countMade(o.voiceDir, order);
	const recent: number[] = [];
	const state: GeneratorState = { running: true, made: 0, total: 0, sets, msPerClip: null, word: null, error: null, updatedAt: '' };
	const save = async (force = false, every = o.saveEvery ?? 10) => {
		state.made = sets.reduce((n, s) => n + s.made, 0);
		state.total = sets.reduce((n, s) => n + s.total, 0);
		state.msPerClip = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
		state.updatedAt = new Date().toISOString();
		o.onProgress?.(state);
		if (force || state.made % every === 0) await writeAtomic(stateFile(o.voiceDir), new TextEncoder().encode(JSON.stringify(state)));
	};
	let result: RunResult = 'done';
	try {
		await sweepPartFiles(o.voiceDir);
		await save(true);
		outer: for (const [i, set] of order.entries()) {
			for (const word of set.words) {
				for (const speed of Object.keys(SPEEDS) as Speed[]) {
					const fp = fingerprint(word, speed);
					const file = clipPath(o.voiceDir, fp);
					if (existsSync(file)) continue;
					if (!o.keepGoing()) {
						result = 'stopped';
						break outer;
					}
					state.word = word;
					const t = performance.now();
					await writeAtomic(file, await o.make(word, speed, fp));
					recent.push(performance.now() - t);
					if (recent.length > 50) recent.shift();
					sets[i]!.made++;
					await save();
				}
			}
		}
	} catch (e) {
		state.error = e instanceof Error ? e.message : String(e);
		throw e;
	} finally {
		state.running = false;
		state.word = null;
		await save(true).catch(() => {});
		await releaseLock(o.voiceDir);
	}
	return result;
}
