/*
 * Voice status for the screens. Counting clips means hashing every word of every list (900k clips), so counts are
 * kept for a few minutes and the running generator's own counts (state.json) are laid over them.
 */

import { availableParallelism } from 'node:os';
import { SPEEDS, fingerprint, type Speed } from './clips.ts';
import { isLocked, listClips, readState } from './generator.ts';
import { CORE_SETS, buildManifest, findListsDir, fullSet, type VoiceSet } from './manifest.ts';
import { activeVoice, readSettings, voiceDir, voiceEnv } from './settings.ts';
import { SUPERTONIC_MODEL, hasModel } from './supertonic.ts';
import type { VoiceBrief, VoiceCost, VoiceSetStatus, VoiceStatus } from '#lib/voice/status.ts';

/** A clip is about 2 KB, but each file takes a whole 4 KB disk block. */
export const CLIP_DISK_BYTES = 4096;
/** The unpacked model. */
export const MODEL_DISK_BYTES = 240_000_000;
/** Measured in low mode (one thread): an M2 laptop and a 2013 server CPU. */
export const FAST_MS_PER_CLIP = 300;
export const SLOW_MS_PER_CLIP = 1600;

const FRESH_MS = 5 * 60_000;

/** Yields to the event loop now and then during long counts. */
const breather = () => new Promise((r) => setImmediate(r));

async function count(set: VoiceSet, have: ReadonlySet<string>): Promise<VoiceSetStatus> {
	let made = 0;
	const speeds = Object.keys(SPEEDS) as Speed[];
	// Nothing on disk: no need to name every clip.
	if (have.size) for (const [i, w] of set.words.entries()) {
		for (const sp of speeds) if (have.has(fingerprint(w, sp))) made++;
		if (i % 5000 === 4999) await breather();
	}
	return { id: set.id, name: set.name, made, total: set.words.length * speeds.length };
}

interface Counts {
	at: number;
	sets: VoiceSetStatus[];
}

const cache = new Map<string, { counts: Counts | null; pending: Promise<Counts> | null }>();

/** Per-set counts for a data folder, recounted when older than a few minutes or after `forget`. */
async function setCounts(dir: string): Promise<Counts> {
	let entry = cache.get(dir);
	if (!entry) cache.set(dir, (entry = { counts: null, pending: null }));
	const e = entry;
	const fresh = e.counts && Date.now() - e.counts.at < FRESH_MS;
	if (!fresh && !e.pending) {
		e.pending = (async () => {
			const manifest = buildManifest(findListsDir());
			const have = listClips(dir);
			const sets: VoiceSetStatus[] = [];
			for (const s of manifest) sets.push(await count(s, have));
			return { at: Date.now(), sets };
		})().then(
			(c) => ((e.counts = c), (e.pending = null), c),
			(err) => ((e.pending = null), Promise.reject(err))
		);
	}
	// A stale count is shown while the new one is made.
	return e.counts ?? e.pending!;
}

/** Drops the saved counts, after clips were removed or remade. */
export function forgetCounts(dir: string): void {
	cache.delete(dir);
	setCache.clear();
}

const setCache = new Map<string, { at: number; status: VoiceSetStatus }>();

/** A set made first runs under this id, so its counts never mix with the same list's share of the manifest. */
export const firstId = (id: string) => `first:${id}`;

/** Clips made for every word of a set, words shared with earlier sets included. */
export async function setProgress(dir: string, id: string): Promise<{ at: number; status: VoiceSetStatus } | null> {
	const hit = setCache.get(`${dir}:${id}`);
	if (hit && Date.now() - hit.at < 60_000) return hit;
	const listsDir = findListsDir();
	const set = fullSet(listsDir, id, id === 'course' ? buildManifest(listsDir) : []);
	if (!set) return null;
	const entry = { at: Date.now(), status: await count(set, listClips(dir)) };
	setCache.set(`${dir}:${id}`, entry);
	return entry;
}

function cost(clips: number, msPerClip: number | null): VoiceCost {
	return {
		clips,
		disk: clips * CLIP_DISK_BYTES,
		fastMs: clips * FAST_MS_PER_CLIP,
		slowMs: clips * SLOW_MS_PER_CLIP,
		hereMs: msPerClip ? clips * msPerClip : null
	};
}

/** Everything the voice screens show, for the machine running the copy. */
export async function voiceStatus(dataDir: string, set?: string): Promise<VoiceStatus> {
	const dir = voiceDir(dataDir);
	const settings = readSettings(dataDir);
	const env = voiceEnv() ?? null;
	const state = readState(dir);
	const running = !!state?.running && isLocked(dir, 0);
	const counts = await setCounts(dir);
	// The generator counted its own sets when it started and keeps them current.
	const liveAt = state ? Date.parse(state.updatedAt) : 0;
	const live = new Map(state?.sets.map((s) => [s.id, s.made]) ?? []);
	const sets = counts.sets.map((s) => ({ ...s, made: (liveAt > counts.at && live.get(s.id)) || s.made }));
	// A set made first is counted apart from the manifest: its new clips go on top of the last count, until the next.
	const firstRun = !!state?.sets.length && state.sets.every((s) => s.id.startsWith('first:'));
	const since = firstRun && state?.startedAt && Date.parse(state.startedAt) >= counts.at ? (state.fresh ?? 0) : 0;
	const total0 = sets.reduce((n, s) => n + s.total, 0);
	const made = Math.min(total0, sets.reduce((n, s) => n + s.made, 0) + since);
	const total = total0;
	const core = sets.filter((s) => CORE_SETS.has(s.id)).reduce((n, s) => n + s.total, 0);
	const msPerClip = state?.msPerClip ?? null;
	const status: VoiceStatus = {
		local: true,
		voice: activeVoice(settings, env ?? undefined),
		chosen: settings.voice,
		env,
		mode: settings.mode,
		paused: settings.paused,
		first: settings.first,
		cores: availableParallelism(),
		model: { downloaded: hasModel(dir), download: SUPERTONIC_MODEL.bytes, disk: MODEL_DISK_BYTES },
		running,
		word: running ? state!.word : null,
		error: state?.error ?? null,
		downloading: running ? (state!.downloading ?? null) : null,
		msPerClip,
		made,
		total,
		sets,
		cost: { core: cost(core, msPerClip), all: cost(total, msPerClip) }
	};
	if (set) {
		const p = await setProgress(dir, set);
		if (p) {
			const made = (liveAt > p.at && live.get(firstId(set))) || p.status.made;
			status.set = { ...p.status, made, leftMs: msPerClip ? Math.max(0, p.status.total - made) * msPerClip : null };
		}
	}
	return status;
}

/** The few facts the account menu shows, from the settings and the generator's last saved state only. */
export function voiceBrief(dataDir: string): VoiceBrief {
	const dir = voiceDir(dataDir);
	const settings = readSettings(dataDir);
	const state = readState(dir);
	const running = !!state?.running && isLocked(dir, 0);
	return {
		chosen: settings.voice,
		paused: settings.paused,
		mode: settings.mode,
		first: settings.first,
		running,
		downloading: running ? (state!.downloading ?? null) : null,
		made: state?.made ?? 0,
		total: state?.total ?? 0,
		msPerClip: state?.msPerClip ?? null
	};
}
