/**
 * The competitive ladder: speed tiers earned only in the 60-second competitive test, with at
 * least MIN_ACCURACY. Ten ranks have three divisions each, from III (lowest) to I, and Zenith
 * stands alone at 300 WPM and above.
 */

export const COMPETITIVE_SECONDS = 60;
export const MIN_ACCURACY = 92;
export const MIN_WPM = 50;
/** The top of the ladder: Zenith starts here. */
export const ZENITH_WPM = 300;
/** Speeds above this are not accepted as genuine (the same limit applies to every saved result). */
export const MAX_WPM = 400;

/** Each rank with the speed at which each of its divisions (III, II, I) begins. */
export const LEAGUES = [
	{ id: 'silver', name: 'Silver', starts: [50, 53, 57], colour: '#8b96a3' },
	{ id: 'gold', name: 'Gold', starts: [60, 63, 67], colour: '#c9930f' },
	{ id: 'diamond', name: 'Diamond', starts: [70, 75, 80], colour: '#3f7fe0' },
	{ id: 'master', name: 'Master', starts: [85, 90, 95], colour: '#1f9c70' },
	{ id: 'elite', name: 'Elite', starts: [100, 107, 113], colour: '#1a8eb0' },
	{ id: 'champion', name: 'Champion', starts: [120, 127, 133], colour: '#b827b8' },
	{ id: 'grandmaster', name: 'Grandmaster', starts: [140, 148, 156], colour: '#7454e0' },
	{ id: 'prodigy', name: 'Prodigy', starts: [165, 175, 185], colour: '#e0601c' },
	{ id: 'overlord', name: 'Overlord', starts: [195, 210, 225], colour: '#d81e48' },
	{ id: 'transcendent', name: 'Transcendent', starts: [240, 260, 280], colour: '#d9a000' },
	{ id: 'zenith', name: 'Zenith', starts: [ZENITH_WPM], colour: '#a9b8d6' }
] as const;

export type League = (typeof LEAGUES)[number];

export interface Tier {
	/** 1 for Silver III, up to 31 for Zenith. */
	index: number;
	league: League;
	/** III (lowest), II or I; empty for Zenith, which has no divisions. */
	division: string;
	name: string;
	from: number;
	/** Last speed in the tier, or null for Zenith, which has no upper limit. */
	to: number | null;
}

const DIVISIONS = ['III', 'II', 'I'];

/** Every tier, from the lowest to the highest. */
export const TIERS: Tier[] = (() => {
	const starts = LEAGUES.flatMap((league) => league.starts.map((from, d) => ({ league, from, division: league.starts.length > 1 ? DIVISIONS[d]! : '' })));
	return starts.map((t, i) => ({
		index: i + 1,
		league: t.league,
		division: t.division,
		name: t.division ? `${t.league.name} ${t.division}` : t.league.name,
		from: t.from,
		to: starts[i + 1] ? starts[i + 1]!.from - 1 : null
	}));
})();

/** The tier for a best competitive speed, or null below 50 WPM. Speeds count in whole words per minute. */
export function tierFor(wpm: number | null | undefined): Tier | null {
	if (wpm == null || wpm < MIN_WPM) return null;
	const whole = Math.floor(wpm);
	return [...TIERS].reverse().find((t) => whole >= t.from)!;
}

/** The tier after this one, or the first tier when unranked. */
export const nextTier = (tier: Tier | null) => (tier ? (TIERS[tier.index] ?? null) : TIERS[0]!);

/** A tier's range for display, such as "53 to 56 WPM" or "300+ WPM". */
export const tierRange = (t: Tier) => (t.to === null ? `${t.from}+ WPM` : `${t.from} to ${t.to} WPM`);

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
