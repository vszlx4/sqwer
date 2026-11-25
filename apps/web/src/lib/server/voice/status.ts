/*
 * Voice status for the screens. Counting means naming both clips of every word of every set (about 900k), so counts
 * are kept for a few minutes, and the running generator's own counts (state.json) are laid over the chosen sets.
 */

import { availableParallelism } from 'node:os';
import { SPEEDS, fingerprint, type Speed } from './clips.ts';
import { isLocked, listClips, readState, runKey, type GeneratorState } from './generator.ts';
import { chosenSets, loadCatalog, type VoiceSet } from './manifest.ts';
import { lastBattery, onBattery } from './power.ts';
import { CLIP_DISK_BYTES, activeVoice, maxClips, readSettings, voiceDir, voiceEnv, type VoiceSettings } from './settings.ts';
import { readFlagged } from './flagged.ts';
import { SUPERTONIC_MODEL, hasModel } from './supertonic.ts';
import type { VoiceBrief, VoicePhase, VoiceSetStatus, VoiceStatus } from '#lib/voice/status.ts';

export { CLIP_DISK_BYTES } from './settings.ts';
/** The unpacked model. */
export const MODEL_DISK_BYTES = 240_000_000;
/** Wall time per clip before this machine has its own pace, measured on an M2 laptop. */
export const REFERENCE_MS_PER_CLIP = { low: 1900, active: 350 } as const;

const FRESH_MS = 5 * 60_000;
const SPEED_IDS = Object.keys(SPEEDS) as Speed[];

/** Yields to the event loop now and then during long counts. */
const breather = () => new Promise((r) => setImmediate(r));

interface Counts {
	at: number;
	key: string;
	/** Ready words per catalog set. */
	ready: Map<string, number>;
	/** Ready and wanted words over the chosen sets, each word once. */
	union: { ready: number; words: number };
	files: number;
}

const cache = new Map<string, { counts: Counts | null; pending: Promise<Counts> | null }>();

async function countAll(dir: string, chosen: readonly string[]): Promise<Counts> {
	const all = loadCatalog();
	const have = listClips(dir);
	const isReady = (w: string) => SPEED_IDS.every((sp) => have.has(fingerprint(w, sp)));
	const ready = new Map<string, number>();
	const known = new Map<string, boolean>();
	let steps = 0;
	const check = async (w: string) => {
		let r = known.get(w);
		if (r === undefined) known.set(w, (r = have.size > 0 && isReady(w)));
		if (++steps % 5000 === 0) await breather();
		return r;
	};
	for (const s of all) {
		let n = 0;
		for (const w of s.words) if (await check(w)) n++;
		ready.set(s.id, n);
	}
	const seen = new Set<string>();
	const union = { ready: 0, words: 0 };
	for (const s of chosenSets(all, chosen)) {
		for (const w of s.words) {
			if (seen.has(w)) continue;
			seen.add(w);
			union.words++;
			if (known.get(w)) union.ready++;
		}
	}
	return { at: Date.now(), key: runKey(chosen), ready, union, files: have.size };
}

/** Counts for a data folder and chosen sets, recounted when older than a few minutes, after `forget`, or for new sets. */
async function counts(dir: string, chosen: readonly string[]): Promise<Counts> {
	const key = `${dir}\n${runKey(chosen)}`;
	let entry = cache.get(key);
	if (!entry) cache.set(key, (entry = { counts: null, pending: null }));
	const e = entry;
	const fresh = e.counts && Date.now() - e.counts.at < FRESH_MS;
	if (!fresh && !e.pending) {
		e.pending = countAll(dir, chosen).then(
			(c) => ((e.counts = c), (e.pending = null), c),
			(err) => ((e.pending = null), Promise.reject(err))
		);
	}
	// A stale count is shown while the new one is made.
	return e.counts ?? e.pending!;
}

/** Drops the saved counts, after clips were removed or remade. */
export function forgetCounts(): void {
	cache.clear();
}

const isRunning = (dir: string, state: GeneratorState | null) => !!state?.running && isLocked(dir, 0);

/** The generator's state when it belongs to these settings and is newer than the counts. */
function liveState(state: GeneratorState | null, settings: VoiceSettings, at: number): GeneratorState | null {
	return state && state.key === runKey(settings.sets) && Date.parse(state.updatedAt) > at && typeof state.ready === 'number' ? state : null;
}

interface PhaseInput {
	settings: VoiceSettings;
	env: 'skip' | 'pause' | null;
	state: GeneratorState | null;
	running: boolean;
	ready: number;
	words: number;
	battery: boolean;
}

/** One phase, in order of what matters most. */
export function phaseOf({ settings, env, state, running, ready, words, battery }: PhaseInput): VoicePhase {
	if (env === 'skip') return 'skip';
	if (settings.voice !== 'supertonic') return 'off';
	if (env === 'pause') return 'held';
	if (running && state?.downloading) return 'downloading';
	if (settings.paused) return 'paused';
	if (!settings.sets.length) return 'empty';
	if (running && state?.waiting === 'battery') return 'battery';
	if (running) return 'making';
	if (state?.full && state.limit != null && state.limit === maxClips(settings)) return 'full';
	if (words > 0 && ready >= words) return 'ready';
	if (!settings.battery && battery) return 'battery';
	return 'starting';
}

/** Everything the voice screens show, for the machine running the copy. */
export async function voiceStatus(dataDir: string): Promise<VoiceStatus> {
	const dir = voiceDir(dataDir);
	const settings = readSettings(dataDir);
	const env = voiceEnv() ?? null;
	const state = readState(dir);
	const running = isRunning(dir, state);
	const c = await counts(dir, settings.sets);
	const live = liveState(state, settings, c.at);
	const liveSets = new Map(live?.sets.map((s) => [s.id, s.ready]) ?? []);
	const ms = state?.msPerClip ?? REFERENCE_MS_PER_CLIP[settings.mode];
	const order = new Map(settings.sets.map((id, i) => [id, i]));
	const sets: VoiceSetStatus[] = loadCatalog().map((s: VoiceSet) => {
		const ready = liveSets.get(s.id) ?? c.ready.get(s.id) ?? 0;
		return {
			id: s.id,
			name: s.name,
			words: s.words.length,
			ready,
			order: order.get(s.id) ?? null,
			disk: s.words.length * SPEED_IDS.length * CLIP_DISK_BYTES,
			leftMs: (s.words.length - ready) * SPEED_IDS.length * ms
		};
	});
	const ready = live?.ready ?? c.union.ready;
	const words = live?.words ?? c.union.words;
	const left = live ? live.left : (words - ready) * SPEED_IDS.length;
	const files = c.files + Math.max(0, (live?.ready ?? c.union.ready) - c.union.ready) * SPEED_IDS.length;
	const battery = settings.voice === 'supertonic' && !settings.battery ? await onBattery() : lastBattery();
	return {
		local: true,
		voice: activeVoice(settings, env ?? undefined),
		chosen: settings.voice,
		env,
		phase: phaseOf({ settings, env, state, running, ready, words, battery }),
		mode: settings.mode,
		paused: settings.paused,
		battery: settings.battery,
		cores: availableParallelism(),
		model: { downloaded: hasModel(dir), download: SUPERTONIC_MODEL.bytes, disk: MODEL_DISK_BYTES },
		word: running && !state?.waiting ? (state?.word ?? null) : null,
		making: running ? (state?.making ?? null) : null,
		error: state?.error ?? null,
		downloading: running ? (state?.downloading ?? null) : null,
		msPerClip: state?.msPerClip ?? null,
		ready,
		words,
		leftMs: left * ms,
		sets,
		diskLimit: settings.diskLimit,
		clipsDisk: files * CLIP_DISK_BYTES,
		flagged: readFlagged(dir)
	};
}

/** The few facts the account menu shows, from the settings and the generator's last saved state only. */
export function voiceBrief(dataDir: string): VoiceBrief {
	const dir = voiceDir(dataDir);
	const settings = readSettings(dataDir);
	const state = readState(dir);
	const running = isRunning(dir, state);
	const own = state?.key === runKey(settings.sets) && typeof state.ready === 'number' ? state : null;
	const ready = own?.ready ?? 0;
	const words = own?.words ?? 0;
	const env = voiceEnv() ?? null;
	return {
		chosen: settings.voice,
		phase: phaseOf({ settings, env, state, running, ready, words, battery: lastBattery() }),
		ready,
		words,
		leftMs: own?.msPerClip ? own.left * own.msPerClip : null,
		downloading: running ? (state?.downloading ?? null) : null
	};
}
