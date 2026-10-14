import { FINGERS, type Finger, type KeyboardLayout } from '@sqwer/layouts';
import { buildProfile, type FingerObservation } from './profile.ts';

export const FILE_FORMAT = 'sqwer-fingers';
export const FILE_VERSION = 1;
export const FILE_EXTENSION = '.sqwer-fingers.json';

/** Largest file accepted on import. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface ProfileFile {
	format: typeof FILE_FORMAT;
	version: typeof FILE_VERSION;
	exportedAt: string;
	layout: string;
	/** Human-readable digest; ignored on import. */
	summary: {
		samples: number;
		coreCoverage: string;
		keys: Record<string, { finger: Finger; share: number; samples: number }>;
		habits: string[];
	};
	observations: FingerObservation[];
}

export function serializeProfile(observations: readonly FingerObservation[], layout: KeyboardLayout, now = new Date()): string {
	const profile = buildProfile(observations, layout);
	const keys: ProfileFile['summary']['keys'] = {};
	for (const k of Object.values(profile.keys)) {
		if (k.finger) keys[k.code] = { finger: k.finger, share: Math.round(k.share * 100) / 100, samples: k.samples };
	}
	const file: ProfileFile = {
		format: FILE_FORMAT,
		version: FILE_VERSION,
		exportedAt: now.toISOString(),
		layout: layout.id,
		summary: {
			samples: profile.samples,
			coreCoverage: `${profile.core.mapped}/${profile.core.total}`,
			keys,
			habits: profile.rules.map((r) => `${r.code} ${r.when} ${r.other} → ${r.finger} (${r.count}/${r.total})`)
		},
		observations: [...observations]
	};
	return JSON.stringify(file, null, 2);
}

const CODE_RE = /^[A-Za-z][A-Za-z0-9]{1,24}$/;

export function isObservation(v: unknown): v is FingerObservation {
	if (!v || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	const keyOrNull = (x: unknown) => x === null || (typeof x === 'string' && CODE_RE.test(x));
	return (
		typeof o.code === 'string' &&
		CODE_RE.test(o.code) &&
		keyOrNull(o.prev) &&
		keyOrNull(o.next) &&
		typeof o.finger === 'string' &&
		(FINGERS as readonly string[]).includes(o.finger) &&
		typeof o.at === 'number' &&
		Number.isFinite(o.at)
	);
}

/** Validates a list of observations from an untrusted source; returns null when any entry is invalid. */
export function cleanObservations(list: unknown, max = 100_000): FingerObservation[] | null {
	if (!Array.isArray(list) || list.length > max || !list.every(isObservation)) return null;
	return list.map((o) => ({ code: o.code, prev: o.prev, next: o.next, finger: o.finger, at: o.at }));
}

/** Union of two observation lists without duplicates, oldest first. */
export function mergeObservations(a: readonly FingerObservation[], b: readonly FingerObservation[]): FingerObservation[] {
	const seen = new Map<string, FingerObservation>();
	for (const o of [...a, ...b]) seen.set(`${o.at}|${o.code}|${o.finger}|${o.prev}|${o.next}`, o);
	return [...seen.values()].sort((x, y) => x.at - y.at);
}

export class ProfileFileError extends Error {}

/** Parse and validate an exported profile. Throws ProfileFileError with a readable message. */
export function parseProfileFile(text: string): { observations: FingerObservation[]; layout: string } {
	if (text.length > MAX_FILE_BYTES) throw new ProfileFileError('The file is too large to be a finger profile.');
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new ProfileFileError('The file does not contain valid JSON.');
	}
	const d = data as Partial<ProfileFile> | null;
	if (!d || d.format !== FILE_FORMAT) throw new ProfileFileError('The file is not a sqwer finger profile.');
	if (d.version !== FILE_VERSION) throw new ProfileFileError(`Unsupported profile version: ${String(d.version)}.`);
	if (!Array.isArray(d.observations)) throw new ProfileFileError('The profile does not contain any entries.');
	const observations = d.observations.filter(isObservation).map((o) => ({
		code: o.code,
		prev: o.prev,
		next: o.next,
		finger: o.finger,
		at: o.at
	}));
	if (observations.length !== d.observations.length) {
		throw new ProfileFileError('The profile contains invalid entries and was not imported.');
	}
	return { observations, layout: typeof d.layout === 'string' ? d.layout : '' };
}
