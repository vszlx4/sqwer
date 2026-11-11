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
/** low: one thread at the lowest priority; active: all cores but one. */
export type GeneratorMode = (typeof MODES)[number];

export interface VoiceSettings {
	voice: VoiceId;
	mode: GeneratorMode;
	/** Stays paused across restarts. */
	paused: boolean;
}

export const DEFAULT_SETTINGS: VoiceSettings = { voice: 'standard', mode: 'low', paused: false };

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
		paused: saved.paused === true
	};
}

export async function writeSettings(dataDir: string, change: Partial<VoiceSettings>): Promise<VoiceSettings> {
	const next = { ...readSettings(dataDir), ...change };
	const file = settingsFile(dataDir);
	await mkdir(path.dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.part`;
	await writeFile(tmp, `${JSON.stringify(next, null, '\t')}\n`);
	await rename(tmp, file);
	return next;
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

/** Whether the Supertonic generator may run now. */
export function shouldGenerate(settings: VoiceSettings, env: VoiceEnv = voiceEnv()): boolean {
	return env === undefined && settings.voice === 'supertonic' && !settings.paused;
}
