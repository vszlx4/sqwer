import { CHANNELS } from '#lib/analytics/shared.ts';
import type { EventFilters, Filters, Range } from './query.ts';

/* Dashboard range and filters from the URL. Invalid values fall back to defaults. */

const DAY = 24 * 60 * 60 * 1000;
export const PRESETS = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 } as const;
export type Preset = keyof typeof PRESETS | 'custom';
const MAX_DAYS = 400;

const dayStart = (t: number) => Math.floor(t / DAY) * DAY;
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);
const parseDay = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) ? Date.parse(`${s}T00:00:00Z`) : null);

export interface Period {
	preset: Preset;
	range: Range;
	/** Inclusive first and last day, for the date inputs. */
	fromDay: string;
	toDay: string;
	days: number;
}

export function readPeriod(params: URLSearchParams, now = Date.now()): Period {
	const today = dayStart(now);
	const preset = (params.get('range') ?? '30d') as Preset;
	let from: number;
	let to: number;
	const customFrom = parseDay(params.get('from'));
	const customTo = parseDay(params.get('to'));
	const custom = preset === 'custom' && customFrom !== null && customTo !== null && customFrom <= customTo;
	if (custom) {
		to = Math.min(customTo, today) + DAY;
		from = Math.max(customFrom, to - MAX_DAYS * DAY);
	} else {
		const days = PRESETS[preset as keyof typeof PRESETS] ?? 30;
		to = today + DAY;
		from = to - days * DAY;
	}
	const usedPreset: Preset = custom ? 'custom' : preset in PRESETS ? preset : '30d';
	return { preset: usedPreset, range: { from: new Date(from), to: new Date(to) }, fromDay: isoDay(from), toDay: isoDay(to - DAY), days: Math.round((to - from) / DAY) };
}

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | null => (value && (allowed as readonly string[]).includes(value) ? (value as T) : null);
const short = (value: string | null, max = 120) => (value && value.length <= max ? value : null);

export function readFilters(params: URLSearchParams): Filters {
	return {
		route: short(params.get('page'), 300),
		channel: pick(params.get('channel'), CHANNELS),
		device: pick(params.get('device'), ['desktop', 'mobile', 'tablet'] as const),
		auth: pick(params.get('visitors'), ['signed-in', 'anonymous'] as const)
	};
}

export function readEventFilters(params: URLSearchParams): EventFilters {
	return {
		...readFilters(params),
		name: short(params.get('event'), 60),
		source: pick(params.get('source'), ['client', 'server'] as const),
		session: short(params.get('session'), 60),
		browser: short(params.get('browser'), 40),
		os: short(params.get('os'), 40),
		referrer: short(params.get('referrer'), 255)
	};
}

/** The keyset cursor of the events list: `<ISO time>|<id>`. */
export function readCursor(params: URLSearchParams): { at: string; id: string } | null {
	const raw = params.get('after');
	if (!raw || raw.length > 120) return null;
	const [at, id] = raw.split('|');
	return at && id && !Number.isNaN(Date.parse(at)) ? { at, id } : null;
}
