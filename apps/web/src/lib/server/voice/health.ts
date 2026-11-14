/*
 * Health check for the Supertonic clips: leftover temporary files, empty or broken files, clips too short or too long
 * to be one spoken word, and orphans (clips no set wants, left by a changed setting or respelling). Broken clips and
 * orphans are removed, so the generator makes the broken ones again.
 */

import { existsSync } from 'node:fs';
import { open, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { SPEEDS, clipPath, clipsDir, fingerprint, type Speed } from './clips.ts';
import { isLocked, readState, writeState } from './generator.ts';
import type { VoiceSet } from './manifest.ts';
import { MP3_KBPS } from './mp3.ts';
import type { HealthReport } from '#lib/voice/status.ts';

/** Shortest and longest believable clip for one word, in seconds at the clip bit rate. */
export const MIN_SECONDS = 0.1;
export const MAX_SECONDS = 6;

/**
 * checked: clips looked at; parts: temporary files removed (none while a generator runs); empty; bad: not an MP3;
 * length: too short or long for one word; orphans: clips no set wants (whole check only); removed: broken plus orphans.
 */
export type { HealthReport };

export type ClipProblem = 'empty' | 'bad' | 'length' | null;

/** What is wrong with a clip, from its size and first bytes. */
export function clipProblem(size: number, head: Uint8Array): ClipProblem {
	if (size === 0) return 'empty';
	const id3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
	const frame = head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0;
	if (!id3 && !frame) return 'bad';
	const seconds = (size * 8) / (MP3_KBPS * 1000);
	return seconds < MIN_SECONDS || seconds > MAX_SECONDS ? 'length' : null;
}

async function inspect(file: string): Promise<ClipProblem> {
	const { size } = await stat(file);
	if (size === 0) return 'empty';
	const fh = await open(file, 'r');
	try {
		const head = new Uint8Array(4);
		await fh.read(head, 0, 4, 0);
		return clipProblem(size, head);
	} finally {
		await fh.close();
	}
}

/** Runs `fn` over items, a few at a time. */
async function each<T>(items: readonly T[], fn: (item: T) => Promise<void>, width = 32): Promise<void> {
	let next = 0;
	await Promise.all(Array.from({ length: Math.min(width, items.length) }, async () => {
		while (next < items.length) await fn(items[next++]!);
	}));
}

/**
 * Checks the clips of one set (`only`), or every clip on disk when `only` is left out. `sets` is the full manifest,
 * which decides what counts as an orphan.
 */
export async function checkClips(voiceDir: string, sets: readonly VoiceSet[], only?: VoiceSet): Promise<HealthReport> {
	const report: HealthReport = { checked: 0, parts: 0, empty: 0, bad: 0, length: 0, orphans: 0, removed: 0 };
	const root = clipsDir(voiceDir);
	if (!existsSync(root)) return report;
	const speeds = Object.keys(SPEEDS) as Speed[];
	const fps = (s: VoiceSet) => s.words.flatMap((w) => speeds.map((sp) => fingerprint(w, sp)));

	// Every file on disk, by folder: clips and leftover temporary files.
	const clips: string[] = [];
	const parts: string[] = [];
	for (const sub of await readdir(root, { withFileTypes: true })) {
		if (!sub.isDirectory()) continue;
		for (const f of await readdir(path.join(root, sub.name))) {
			if (f.endsWith('.mp3')) clips.push(f.slice(0, -4));
			else if (f.endsWith('.part')) parts.push(path.join(root, sub.name, f));
		}
	}

	// A running generator writes through .part files; only a crash leaves them behind.
	if (!isLocked(voiceDir, 0)) {
		for (const f of parts) await rm(f, { force: true });
		report.parts = parts.length;
	}

	let look: string[];
	if (only) {
		const onDisk = new Set(clips);
		look = fps(only).filter((fp) => onDisk.has(fp));
	} else {
		const wanted = new Set(sets.flatMap(fps));
		look = [];
		for (const fp of clips) {
			if (wanted.has(fp)) look.push(fp);
			else {
				await rm(clipPath(voiceDir, fp), { force: true });
				report.orphans++;
				report.removed++;
			}
		}
	}

	await each(look, async (fp) => {
		const file = clipPath(voiceDir, fp);
		const problem = await inspect(file).catch(() => null);
		report.checked++;
		if (!problem) return;
		report[problem]++;
		await rm(file, { force: true });
		report.removed++;
	});
	// Something to make again: the site's generator must not take "all made" from an earlier run.
	const state = readState(voiceDir);
	if (report.removed && state?.all && !isLocked(voiceDir, 0)) await writeState(voiceDir, { ...state, all: false, updatedAt: new Date().toISOString() });
	return report;
}
