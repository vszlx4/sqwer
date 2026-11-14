/*
 * The voice status the screens show (account Voice page, account menu, Listen and type menu), from GET /api/voice,
 * and the requests that change it. Only the machine running the copy sees the details and may change them.
 */

import { formatNumber } from '#lib/i18n/format.ts';

export type VoiceId = 'standard' | 'supertonic';
export type VoiceMode = 'low' | 'active';

export interface VoiceSetStatus {
	id: string;
	name: string;
	/** Clips on disk and wanted (two per word: normal and slow). */
	made: number;
	total: number;
}

/** What making a group of clips costs: disk space and time at two reference speeds, or this machine's. */
export interface VoiceCost {
	clips: number;
	disk: number;
	/** Time in low mode: a recent laptop and an older server, or null when this machine's speed is known. */
	fastMs: number;
	slowMs: number;
	/** This machine's time from its own recent clips, once it has made some. */
	hereMs: number | null;
}

export interface VoiceStatus {
	local: true;
	/** The voice clips are served in (SQWER_VOICE=skip forces Standard). */
	voice: VoiceId;
	/** The voice picked in the settings. */
	chosen: VoiceId;
	env: 'skip' | 'pause' | null;
	mode: VoiceMode;
	paused: boolean;
	first: string | null;
	cores: number;
	model: { downloaded: boolean; download: number; disk: number };
	running: boolean;
	word: string | null;
	error: string | null;
	downloading: { received: number; total: number } | null;
	msPerClip: number | null;
	made: number;
	total: number;
	sets: VoiceSetStatus[];
	cost: { core: VoiceCost; all: VoiceCost };
	/** The set asked for with ?set=, counting every word it holds, shared ones included. */
	set?: VoiceSetStatus & { leftMs: number | null };
}

/** The account menu's summary. made and total are the generator's last run (every set, or what voice:sync makes). */
export interface VoiceBrief {
	chosen: VoiceId;
	paused: boolean;
	mode: VoiceMode;
	/** A set made before the rest; made and total are then that set's. */
	first: string | null;
	running: boolean;
	downloading: { received: number; total: number } | null;
	made: number;
	total: number;
	msPerClip: number | null;
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
	| { action: 'first'; set: string }
	| { action: 'check'; set?: string };

export async function fetchBrief(): Promise<VoiceBrief | null> {
	try {
		const res = await fetch('/api/voice?brief=1');
		const data = res.ok ? await res.json() : null;
		return data?.local ? (data.brief as VoiceBrief) : null;
	} catch {
		return null;
	}
}

export async function fetchVoice(set?: string): Promise<VoiceInfo | null> {
	try {
		const res = await fetch(set ? `/api/voice?set=${encodeURIComponent(set)}` : '/api/voice');
		return res.ok ? ((await res.json()) as VoiceInfo) : null;
	} catch {
		return null;
	}
}

export async function sendVoice(body: VoiceAction, set?: string): Promise<{ status?: VoiceStatus; report?: HealthReport; error?: string }> {
	try {
		const res = await fetch(set ? `/api/voice?set=${encodeURIComponent(set)}` : '/api/voice', {
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

/** Time left for what is not made yet, from this machine's recent pace. */
export const timeLeft = (made: number, total: number, msPerClip: number | null) => (msPerClip ? Math.max(0, total - made) * msPerClip : null);
