import { FINGERS, handOf, type Finger, type KeyboardLayout } from '@sqwer/layouts';

/** One tagged keystroke: the user told us which finger pressed `code`. */
export interface FingerObservation {
	/** KeyboardEvent.code of the key pressed. */
	code: string;
	/** Key pressed just before, within the same prompt. */
	prev: string | null;
	/** Key pressed just after, within the same prompt. */
	next: string | null;
	finger: Finger;
	/** Epoch milliseconds. */
	at: number;
}

/** Samples needed before a key counts as mapped. */
export const MIN_SAMPLES = 3;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => `Key${c}`);

/** Keys every typist uses; coverage is measured against these. */
export const CORE_KEYS: readonly string[] = [...LETTERS, 'Space', 'Comma', 'Period', 'Semicolon', 'Quote', 'Slash'];

/** Number row and remaining symbol keys, mapped on request. */
export const EXTENDED_KEYS: readonly string[] = [
	...'1234567890'.split('').map((d) => `Digit${d}`),
	'Minus',
	'Equal',
	'BracketLeft',
	'BracketRight',
	'Backslash',
	'Backquote'
];

export const SHIFT_KEYS = ['ShiftLeft', 'ShiftRight'] as const;

export type FingerCounts = Partial<Record<Finger, number>>;

export interface KeyStat {
	code: string;
	samples: number;
	counts: FingerCounts;
	/** Most used finger, or null with no samples. */
	finger: Finger | null;
	/** Share of samples that used `finger`. */
	share: number;
	/** 0–1: grows with samples and with consistency. */
	confidence: number;
	mapped: boolean;
	/** Finger a standard touch typist would use. */
	standard: Finger | undefined;
	/** The user's main finger differs from the standard one. */
	differs: boolean;
}

/** A habit that overrides the key's usual finger in a specific neighbourhood. */
export interface ContextRule {
	code: string;
	when: 'after' | 'before';
	/** The neighbouring key. */
	other: string;
	finger: Finger;
	count: number;
	total: number;
}

export interface ShiftHabit {
	samples: number;
	left: number;
	right: number;
	/** Share of shifted characters where Shift was on the other hand from the character. */
	opposite: number;
	fingers: FingerCounts;
}

export interface Coverage {
	mapped: number;
	total: number;
}

export interface FingerProfile {
	samples: number;
	keys: Record<string, KeyStat>;
	rules: ContextRule[];
	shift: ShiftHabit;
	core: Coverage;
	extended: Coverage;
	/** How many mapped keys each finger owns. */
	load: Record<Finger, number>;
}

function top(counts: FingerCounts): { finger: Finger | null; count: number; total: number } {
	let finger: Finger | null = null;
	let count = 0;
	let total = 0;
	for (const f of FINGERS) {
		const n = counts[f] ?? 0;
		total += n;
		if (n > count) {
			count = n;
			finger = f;
		}
	}
	return { finger, count, total };
}

function bump(counts: FingerCounts, f: Finger) {
	counts[f] = (counts[f] ?? 0) + 1;
}

export function buildProfile(observations: readonly FingerObservation[], layout: KeyboardLayout): FingerProfile {
	const perKey = new Map<string, FingerCounts>();
	const contexts = new Map<string, FingerCounts>();
	const shiftObs: FingerObservation[] = [];

	for (const o of observations) {
		if (o.code === 'ShiftLeft' || o.code === 'ShiftRight') shiftObs.push(o);
		if (!perKey.has(o.code)) perKey.set(o.code, {});
		bump(perKey.get(o.code)!, o.finger);
		for (const [when, other] of [
			['after', o.prev],
			['before', o.next]
		] as const) {
			if (!other) continue;
			const key = `${o.code}|${when}|${other}`;
			if (!contexts.has(key)) contexts.set(key, {});
			bump(contexts.get(key)!, o.finger);
		}
	}

	const standardOf = new Map(layout.keys.map((k) => [k.code, k.finger]));
	const keys: Record<string, KeyStat> = {};
	for (const [code, counts] of perKey) {
		const { finger, count, total } = top(counts);
		const share = total ? count / total : 0;
		const standard = standardOf.get(code);
		keys[code] = {
			code,
			samples: total,
			counts,
			finger,
			share,
			confidence: Math.min(1, total / MIN_SAMPLES) * share,
			mapped: total >= MIN_SAMPLES,
			standard,
			differs: !!finger && !!standard && finger !== standard
		};
	}

	const rules: ContextRule[] = [];
	for (const [key, counts] of contexts) {
		const [code, when, other] = key.split('|') as [string, 'after' | 'before', string];
		const { finger, count, total } = top(counts);
		const usual = keys[code]?.finger;
		if (finger && finger !== usual && total >= 2 && count / total >= 2 / 3) {
			rules.push({ code, when, other, finger, count, total });
		}
	}
	rules.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

	const fingers: FingerCounts = {};
	let left = 0;
	let right = 0;
	let opposite = 0;
	for (const o of shiftObs) {
		bump(fingers, o.finger);
		if (o.code === 'ShiftLeft') left++;
		else right++;
		const charFinger = o.next ? (keys[o.next]?.finger ?? standardOf.get(o.next)) : undefined;
		const shiftHand = o.code === 'ShiftLeft' ? 'left' : 'right';
		if (charFinger && handOf(charFinger) !== shiftHand) opposite++;
	}

	const coverage = (list: readonly string[]): Coverage => ({
		mapped: list.filter((c) => keys[c]?.mapped).length,
		total: list.length
	});

	const load = Object.fromEntries(FINGERS.map((f) => [f, 0])) as Record<Finger, number>;
	for (const k of Object.values(keys)) {
		if (k.mapped && k.finger && !k.code.startsWith('Shift')) load[k.finger]++;
	}

	return {
		samples: observations.length,
		keys,
		rules,
		shift: {
			samples: shiftObs.length,
			left,
			right,
			opposite: shiftObs.length ? opposite / shiftObs.length : 0,
			fingers
		},
		core: coverage(CORE_KEYS),
		extended: coverage(EXTENDED_KEYS),
		load
	};
}

/** The finger this user most likely uses for `code` given its neighbours. */
export function predictFinger(
	profile: FingerProfile,
	code: string,
	prev?: string | null,
	next?: string | null
): Finger | undefined {
	const rule =
		(prev && profile.rules.find((r) => r.code === code && r.when === 'after' && r.other === prev)) ||
		(next && profile.rules.find((r) => r.code === code && r.when === 'before' && r.other === next));
	if (rule) return rule.finger;
	return profile.keys[code]?.finger ?? undefined;
}

/** 0 when a key is well mapped, 1 when nothing is known about it. */
export function keyNeed(profile: FingerProfile, code: string): number {
	const n = profile.keys[code]?.samples ?? 0;
	return Math.max(0, MIN_SAMPLES - n) / MIN_SAMPLES;
}
