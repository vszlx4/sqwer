/**
 * The competitive ladder: speed tiers earned only in the 60-second competitive test, with at
 * least MIN_ACCURACY. Tiers are 10 WPM wide, from 50 to 300 WPM, grouped into seven leagues.
 */

export const COMPETITIVE_SECONDS = 60;
export const MIN_ACCURACY = 92;
export const MIN_WPM = 50;
export const MAX_WPM = 300;

export const LEAGUES = [
	{ id: 'bronze', name: 'Bronze', from: 50, colour: '#c47a3e' },
	{ id: 'silver', name: 'Silver', from: 90, colour: '#8b96a3' },
	{ id: 'gold', name: 'Gold', from: 130, colour: '#d29b14' },
	{ id: 'platinum', name: 'Platinum', from: 170, colour: '#2a9d8f' },
	{ id: 'diamond', name: 'Diamond', from: 210, colour: '#4f7cf0' },
	{ id: 'master', name: 'Master', from: 250, colour: '#8a5cf0' },
	{ id: 'grandmaster', name: 'Grandmaster', from: 290, colour: '#e0457b' }
] as const;

export type League = (typeof LEAGUES)[number];

export interface Tier {
	/** 1 for 50 to 59 WPM, up to 25 for 290 to 300 WPM. */
	index: number;
	league: League;
	/** Division within the league, IV (lowest) to I, or none for Grandmaster. */
	division: string;
	name: string;
	from: number;
	to: number;
}

const ROMAN = ['IV', 'III', 'II', 'I'];

/** Every tier, from the lowest to the highest. */
export const TIERS: Tier[] = Array.from({ length: 25 }, (_, i) => {
	const from = MIN_WPM + i * 10;
	const league = [...LEAGUES].reverse().find((l) => from >= l.from)!;
	const step = (from - league.from) / 10;
	const division = league.id === 'grandmaster' ? '' : ROMAN[step]!;
	return { index: i + 1, league, division, name: division ? `${league.name} ${division}` : league.name, from, to: i === 24 ? MAX_WPM : from + 9 };
});

/** The tier for a best competitive speed, or null below 50 WPM. */
export function tierFor(wpm: number | null | undefined): Tier | null {
	if (wpm == null || wpm < MIN_WPM) return null;
	return TIERS[Math.min(24, Math.floor((Math.min(wpm, MAX_WPM) - MIN_WPM) / 10))]!;
}

/** The tier after this one, or the first tier when unranked. */
export const nextTier = (tier: Tier | null) => (tier ? (TIERS[tier.index] ?? null) : TIERS[0]!);

export interface ReplayCheck {
	seconds: number;
	wpm: number;
	accuracy: number;
	chars: { correct: number };
	words: { w: string; ok: boolean }[];
	replay: [number, string][];
}

/**
 * Server-side plausibility check for a competitive result: the right duration, enough accuracy,
 * a keystroke record that spans the test, and a speed that matches the characters typed.
 */
export function verifyCompetitive(r: ReplayCheck): boolean {
	if (Math.abs(r.seconds - COMPETITIVE_SECONDS) > 1.5) return false;
	if (r.accuracy < MIN_ACCURACY || r.wpm > MAX_WPM) return false;
	if (r.replay.length < r.chars.correct * 0.9) return false;
	const span = (r.replay.at(-1)?.[0] ?? 0) - (r.replay[0]?.[0] ?? 0);
	if (span < 45_000) return false;
	// No human types keys less than 15 ms apart on average over a whole minute.
	if (span / Math.max(1, r.replay.length) < 15) return false;
	// The speed must match the correctly typed words (with their spaces), as the engine counts them.
	const net = r.words.filter((w) => w.ok).reduce((n, w) => n + w.w.length + 1, 0);
	const expected = net / 5 / (r.seconds / 60);
	return Math.abs(expected - r.wpm) <= Math.max(4, r.wpm * 0.06);
}
