/*
 * The voice status the screens show (account Voice page, account menu, Listen and type menu), from GET /api/voice,
 * and the requests that change it. Only the machine running the copy sees the details and may change them.
 */

import { formatNumber } from '#lib/i18n/format.ts';

export type VoiceId = 'standard' | 'supertonic';
export type VoiceMode = 'low' | 'active';

/** What players see. Ids stay as they are: settings, clip folders and addresses use them. */
export const VOICE_NAME: Record<VoiceId, string> = { standard: 'Standard', supertonic: 'Enhanced' };

/** A set a person may choose: its words, how many have both clips, and whether and where it is chosen. */
export interface VoiceSetStatus {
	id: string;
	name: string;
	words: number;
	ready: number;
	/** Place in the making order, from 0, or null when not chosen. */
	order: number | null;
	/** Disk for all its clips, and time to make the missing ones (this machine's pace, or a reference one). */
	disk: number;
	leftMs: number;
}

/**
 * Where the Enhanced voice stands, one at a time: off (Standard chosen), held by SQWER_VOICE, downloading the model,
 * making clips, paused, waiting for the charger, stopped at the disk limit, nothing chosen, ready, or waiting to start.
 */
export type VoicePhase = 'off' | 'skip' | 'held' | 'downloading' | 'making' | 'paused' | 'battery' | 'full' | 'empty' | 'ready' | 'starting';

export interface VoiceStatus {
	local: true;
	/** The voice clips are served in (SQWER_VOICE=skip forces Standard). */
	voice: VoiceId;
	/** The voice picked in the settings. */
	chosen: VoiceId;
	env: 'skip' | 'pause' | null;
	phase: VoicePhase;
	mode: VoiceMode;
	paused: boolean;
	/** Clips are made on battery too. */
	battery: boolean;
	cores: number;
	model: { downloaded: boolean; download: number; disk: number };
	word: string | null;
	/** The set the current word is made for. */
	making: string | null;
	error: string | null;
	downloading: { received: number; total: number } | null;
	/** Wall time per clip at the recent pace, rests included, or null before any. */
	msPerClip: number | null;
	/** Words ready and wanted over the chosen sets, each word once; time to make the rest. */
	ready: number;
	words: number;
	leftMs: number;
	/** Every set, in catalog order. */
	sets: VoiceSetStatus[];
	/** Most disk the clips may take, in GB, or null; what the clips on disk take. */
	diskLimit: number | null;
	clipsDisk: number;
	/** Words rated unclear in Listen and type on this machine, newest first. */
	flagged: string[];
}

/** The account menu's summary, from the settings and the generator's last saved state. */
export interface VoiceBrief {
	chosen: VoiceId;
	phase: VoicePhase;
	ready: number;
	words: number;
	leftMs: number | null;
	downloading: { received: number; total: number } | null;
}

/** What anyone else sees. */
/** The voice in use and its settings version, for clip addresses. */
export interface VoiceVersion {
	voice: VoiceId;
	version: string;
}

export interface VoiceRemote {
	local: false;
	voice: VoiceId;
}

export type VoiceInfo = VoiceStatus | VoiceRemote;

export interface HealthReport {
	checked: number;
	parts: number;
	empty: number;
	bad: number;
	length: number;
	orphans: number;
	removed: number;
}

export type VoiceAction =
	| { action: 'use'; voice: VoiceId }
	| { action: 'pause' }
	| { action: 'resume' }
	| { action: 'mode'; mode: VoiceMode }
	| { action: 'set'; set: string; on: boolean }
	| { action: 'next'; set: string }
	| { action: 'battery'; on: boolean }
	| { action: 'check'; set?: string }
	| { action: 'limit'; gb: number | null }
	| { action: 'flag'; word: string; on: boolean }
	| { action: 'unflag-all' };

/** Disk limits the Voice page offers, in GB. */
export const DISK_LIMIT_CHOICES = [1, 2, 5, 10, 20] as const;

export async function fetchBrief(): Promise<VoiceBrief | null> {
	try {
		const res = await fetch('/api/voice?brief=1');
		const data = res.ok ? await res.json() : null;
		return data?.local ? (data.brief as VoiceBrief) : null;
	} catch {
		return null;
	}
}

let local: Promise<boolean> | null = null;

/** Lists a word rated unclear on the Voice page, or takes it off. Only the computer running the copy keeps the list. */
export async function flagWord(word: string, on: boolean): Promise<void> {
	local ??= fetchBrief().then((b) => b !== null);
	if (await local) await sendVoice({ action: 'flag', word: word.toLowerCase(), on }).catch(() => {});
}

export async function fetchVoice(): Promise<VoiceInfo | null> {
	try {
		const res = await fetch('/api/voice');
		return res.ok ? ((await res.json()) as VoiceInfo) : null;
	} catch {
		return null;
	}
}

export async function sendVoice(body: VoiceAction): Promise<{ status?: VoiceStatus; report?: HealthReport; error?: string }> {
	try {
		const res = await fetch('/api/voice', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await res.json().catch(() => ({}));
		return res.ok ? data : { error: data.message ?? 'That did not work. Try again.' };
	} catch {
		return { error: 'The site could not be reached. Try again.' };
	}
}

/** "about 3 h 20 min", "about 2 days", "under a minute". */
export function formatDuration(ms: number): string {
	const min = Math.round(ms / 60_000);
	if (min < 1) return 'under a minute';
	if (min < 60) return `about ${min} min`;
	const h = Math.floor(min / 60);
	if (h < 48) return `about ${h} h${min % 60 && h < 10 ? ` ${min % 60} min` : ''}`;
	return `about ${formatNumber(Math.round(h / 24))} days`;
}

export function formatBytes(bytes: number): string {
	if (bytes >= 1e9) return `${formatNumber(Math.round(bytes / 1e8) / 10)} GB`;
	if (bytes >= 1e6) return `${formatNumber(Math.round(bytes / 1e6))} MB`;
	return `${formatNumber(Math.max(1, Math.round(bytes / 1e3)))} KB`;
}

export const percent = (made: number, total: number) => (total ? Math.floor((1000 * made) / total) / 10 : 0);

/** One line for a phase, short enough for the account menu. */
export function phaseLine(v: Pick<VoiceStatus, 'phase' | 'ready' | 'words' | 'downloading'> & { leftMs: number | null }): string {
	switch (v.phase) {
		case 'off':
			return 'Off';
		case 'skip':
			return 'Off (SQWER_VOICE=skip)';
		case 'held':
			return 'Held (SQWER_VOICE=pause)';
		case 'downloading':
			return v.downloading ? `Downloading the model, ${percent(v.downloading.received, v.downloading.total)}%` : 'Downloading the model';
		case 'making':
			return `Making clips, ${percent(v.ready, v.words)}%${v.leftMs ? `, ${formatDuration(v.leftMs)} left` : ''}`;
		case 'paused':
			return 'Paused';
		case 'battery':
			return 'Waiting for the charger';
		case 'full':
			return 'Stopped at the disk limit';
		case 'empty':
			return 'No sets chosen';
		case 'ready':
			return 'Ready';
		case 'starting':
			return 'Starting';
	}
}
