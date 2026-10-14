import type { TypingSession } from '@sqwer/engine';
import { predictFinger, type FingerProfile } from '@sqwer/fingermap';
import { FINGERS, kindOf, pressesFor, type Finger, type FingerKind, type KeyboardLayout } from '@sqwer/layouts';
import type { FingerScore } from './results/types.ts';

export interface Stage {
	kind: Exclude<FingerKind, 'thumb'>;
	title: string;
}

export const STAGES: Stage[] = [
	{ kind: 'pinky', title: 'Little fingers' },
	{ kind: 'ring', title: 'Ring fingers' },
	{ kind: 'middle', title: 'Middle fingers' },
	{ kind: 'index', title: 'Index fingers' }
];

export const STAGE_SECONDS = 20;

/** Pauses longer than this are not counted as finger movement time. */
const MAX_INTERVAL_MS = 2000;

/** The finger this typist uses for `char`, from their map where known. */
export function fingerForChar(
	layout: KeyboardLayout,
	profile: FingerProfile | null,
	char: string,
	prevChar?: string
): Finger | undefined {
	const entry = layout.chars.get(char);
	if (!entry) return undefined;
	const prevCode = prevChar ? (layout.chars.get(prevChar)?.code ?? null) : null;
	const mapped = profile ? predictFinger(profile, entry.code, prevCode, null) : undefined;
	if (mapped) return mapped;
	const presses = pressesFor(layout, char, prevChar);
	return presses[presses.length - 1]?.finger;
}

/**
 * Picks words in which most letters are typed by the given finger kind,
 * according to the typist's own map.
 */
export function stageWords(
	kind: Stage['kind'],
	layout: KeyboardLayout,
	profile: FingerProfile | null,
	vocabulary: readonly string[],
	rand: () => number = Math.random,
	count = 80
): string[] {
	const scored = [...new Set(vocabulary)]
		.map((w) => {
			let hits = 0;
			for (let i = 0; i < w.length; i++) {
				const f = fingerForChar(layout, profile, w[i]!, w[i - 1]);
				if (f && kindOf(f) === kind) hits++;
			}
			return { w, share: hits / w.length };
		})
		.filter((x) => x.share > 0)
		.sort((a, b) => b.share - a.share);
	const pool = scored.slice(0, Math.max(30, Math.floor(scored.length * 0.15))).map((x) => x.w);
	const out: string[] = [];
	for (let i = 0; i < count; i++) {
		let index = Math.floor(rand() * pool.length);
		// Avoid repeating the previous word without risking an endless retry.
		if (pool.length > 1 && pool[index] === out[out.length - 1]) index = (index + 1) % pool.length;
		out.push(pool[index]!);
	}
	return out;
}

interface Tally {
	intervals: number[];
	correct: number;
	total: number;
}

/** Trimmed mean: ignores the slowest tenth, which is usually hesitation rather than finger speed. */
function trimmedMean(values: number[]): number {
	if (!values.length) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const kept = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.9)));
	return kept.reduce((a, b) => a + b, 0) / kept.length;
}

/**
 * Per-finger speed and accuracy from completed stage sessions.
 * Speed is derived from the time between a keystroke and the previous one:
 * 60 000 ms ÷ interval ÷ 5 characters per word.
 */
export function fingerScores(
	sessions: TypingSession[],
	layout: KeyboardLayout,
	profile: FingerProfile | null
): { fingers: Partial<Record<Finger, FingerScore>>; wpm: number; accuracy: number } {
	const tallies = new Map<Finger, Tally>(FINGERS.map((f) => [f, { intervals: [], correct: 0, total: 0 }]));
	let correct = 0;
	let total = 0;
	let netWpm = 0;

	for (const session of sessions) {
		let lastT: number | null = null;
		let prevExpected: string | undefined;
		for (const k of session.keystrokes) {
			if (k.kind === 'delete') {
				lastT = k.t;
				continue;
			}
			const expected = k.expected;
			const interval = lastT === null ? null : k.t - lastT;
			lastT = k.t;
			if (expected === undefined) continue;
			const finger = fingerForChar(layout, profile, expected, prevExpected);
			prevExpected = expected;
			if (!finger) continue;
			const tally = tallies.get(finger)!;
			tally.total++;
			total++;
			if (k.correct) {
				tally.correct++;
				correct++;
				if (interval !== null && interval > 0 && interval <= MAX_INTERVAL_MS) tally.intervals.push(interval);
			}
		}
		const seconds = (session.duration ?? 0) / 1000;
		if (seconds > 0) {
			let chars = 0;
			for (let i = 0; i < session.wordIndex; i++) if (session.inputs[i] === session.targets[i]) chars += session.targets[i]!.length + 1;
			netWpm += (chars / 5) * (60 / seconds);
		}
	}

	const fingers: Partial<Record<Finger, FingerScore>> = {};
	for (const [f, t] of tallies) {
		if (!t.total) continue;
		const mean = trimmedMean(t.intervals);
		fingers[f] = {
			wpm: mean ? Math.round((12000 / mean) * 10) / 10 : 0,
			accuracy: Math.round((t.correct / t.total) * 1000) / 10,
			keystrokes: t.total
		};
	}
	return {
		fingers,
		wpm: sessions.length ? Math.round((netWpm / sessions.length) * 10) / 10 : 0,
		accuracy: total ? Math.round((correct / total) * 1000) / 10 : 0
	};
}

/** Fastest, slowest and least accurate fingers with enough data to be meaningful. */
export function standouts(fingers: Partial<Record<Finger, FingerScore>>, minKeystrokes = 8) {
	const list = (Object.entries(fingers) as [Finger, FingerScore][]).filter(([, s]) => s.keystrokes >= minKeystrokes && s.wpm > 0);
	if (!list.length) return null;
	const byWpm = [...list].sort((a, b) => a[1].wpm - b[1].wpm);
	const byAcc = [...list].sort((a, b) => a[1].accuracy - b[1].accuracy);
	const average = list.reduce((s, [, v]) => s + v.wpm, 0) / list.length;
	return { slowest: byWpm[0]!, fastest: byWpm[byWpm.length - 1]!, leastAccurate: byAcc[0]!, average };
}
