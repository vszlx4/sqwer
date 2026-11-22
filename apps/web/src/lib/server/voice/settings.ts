/*
 * Which voice this copy speaks with, and how its clip generator runs. Kept in DATA_DIR/voice/settings.json.
 * Standard (Kokoro, made per word) is the default; Supertonic is opt-in and is the only voice made ahead of time.
 * SQWER_VOICE=skip keeps Standard and never generates; SQWER_VOICE=pause starts the generator paused.
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const VOICES = ['standard', 'supertonic'] as const;
export type VoiceId = (typeof VOICES)[number];

export const MODES = ['low', 'active'] as const;
/** low: gentle, on the efficiency cores where there are some; active: two threads at normal priority. */
export type GeneratorMode = (typeof MODES)[number];

export interface VoiceSettings {
	voice: VoiceId;
	mode: GeneratorMode;
	/** Stays paused across restarts. */
	paused: boolean;
	/** Sets to make, in making order: 'course' and word list ids. Nothing else is made. */
	sets: string[];
	/** Keep making clips on battery power; otherwise the generator waits for the charger. */
	battery: boolean;
	/** Most disk the clips may take, in GB; null for no limit. The generator stops there. */
	diskLimit: DiskLimit | null;
}

export const DISK_LIMITS = [1, 2, 5, 10, 20] as const;
export type DiskLimit = (typeof DISK_LIMITS)[number];

/** Lessons and the two lists most tests use: about 8,400 words, some 9 hours in low mode on an M2. */
export const DEFAULT_SETS: readonly string[] = ['course', 'english-200', 'english-1k'];
export const MAX_SETS = 40;
const SET_ID = /^[a-z0-9-]{1,40}$/;
export const isSetId = (id: unknown): id is string => typeof id === 'string' && SET_ID.test(id);

export const DEFAULT_SETTINGS: VoiceSettings = { voice: 'standard', mode: 'low', paused: false, sets: [...DEFAULT_SETS], battery: false, diskLimit: null };

/** Saved sets, unique and well formed; a set once made first (older settings) goes to the front. */
function readSets(saved: Partial<VoiceSettings> & { first?: unknown }): string[] {
	const list = Array.isArray(saved.sets) ? saved.sets.filter(isSetId) : [...DEFAULT_SETS];
	if (isSetId(saved.first)) list.unshift(saved.first);
	return [...new Set(list)].slice(0, MAX_SETS);
}

export const voiceDir = (dataDir: string) => path.join(dataDir, 'voice');
const settingsFile = (dataDir: string) => path.join(voiceDir(dataDir), 'settings.json');

/** Settings on disk, with anything missing or unknown taken from the defaults. */
export function readSettings(dataDir: string): VoiceSettings {
	let saved: Partial<VoiceSettings> = {};
	try {
		if (existsSync(settingsFile(dataDir))) saved = JSON.parse(readFileSync(settingsFile(dataDir), 'utf8'));
	} catch {
		// A broken file falls back to the defaults; the next write replaces it.
	}
	return {
		voice: VOICES.includes(saved.voice as VoiceId) ? (saved.voice as VoiceId) : DEFAULT_SETTINGS.voice,
		mode: MODES.includes(saved.mode as GeneratorMode) ? (saved.mode as GeneratorMode) : DEFAULT_SETTINGS.mode,
		paused: saved.paused === true,
		sets: readSets(saved),
		battery: saved.battery === true,
		diskLimit: DISK_LIMITS.includes(saved.diskLimit as DiskLimit) ? (saved.diskLimit as DiskLimit) : null
	};
}

/** Writes one at a time, so a change read-merged-written never drops one made a moment earlier. */
let writing: Promise<unknown> = Promise.resolve();
let writes = 0;

export function writeSettings(dataDir: string, change: Partial<VoiceSettings>): Promise<VoiceSettings> {
	const job = writing.catch(() => {}).then(async () => {
		const next: VoiceSettings = { ...readSettings(dataDir), ...change };
		const file = settingsFile(dataDir);
		await mkdir(path.dirname(file), { recursive: true });
		const tmp = `${file}.${process.pid}.${++writes}.part`;
		await writeFile(tmp, `${JSON.stringify(next, null, '\t')}\n`);
		await rename(tmp, file);
		return next;
	});
	writing = job;
	return job;
}

export type VoiceEnv = 'skip' | 'pause' | undefined;

export function voiceEnv(env: NodeJS.ProcessEnv = process.env): VoiceEnv {
	const v = env.SQWER_VOICE?.trim().toLowerCase();
	return v === 'skip' || v === 'pause' ? v : undefined;
}

/** The voice clips are served in: SQWER_VOICE=skip forces Standard. */
export function activeVoice(settings: VoiceSettings, env: VoiceEnv = voiceEnv()): VoiceId {
	return env === 'skip' ? 'standard' : settings.voice;
}

/** A clip is about 2.5 KB, but each file takes a whole 4 KB disk block. */
export const CLIP_DISK_BYTES = 4096;

/** Clips that fit in the disk limit; null for no limit. */
export const maxClips = (s: Pick<VoiceSettings, 'diskLimit'>) => (s.diskLimit ? Math.floor((s.diskLimit * 1e9) / CLIP_DISK_BYTES) : null);

/** Whether the Supertonic generator may run now. */
export function shouldGenerate(settings: VoiceSettings, env: VoiceEnv = voiceEnv()): boolean {
	return env === undefined && settings.voice === 'supertonic' && !settings.paused;
}
