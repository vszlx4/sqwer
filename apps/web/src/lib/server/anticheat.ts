import { computeStats, replaySession } from '@sqwer/engine';
import { MAX_WPM } from '#lib/progress/competitive.ts';
import { decodeKeystrokes } from '#lib/results/detail.ts';
import type { ResultDetail } from '#lib/results/types.ts';

/*
 * Server-side checks of a typing result before it earns XP or a rank. The browser sends its
 * keystroke record; the server replays it with the same engine (packages/engine) and decides:
 *
 * - reject: impossible or forged (keystrokes out of order or after the end, counts or headline
 *   numbers that the keystrokes do not produce, faster than any person). Not stored at all.
 * - untrusted: stored in the history, but earns no XP and is never ranked (no keystroke record, or
 *   timing as regular as a machine's).
 * - trusted: the recomputed numbers, never the browser's, are used for XP and ranks.
 */

export interface ResultClaim {
	status: 'completed' | 'abandoned';
	at: number;
	wpm: number;
	accuracy: number;
	seconds: number;
	detail?: Pick<ResultDetail, 'targets' | 'replay' | 'keystrokes'> & Partial<ResultDetail>;
}

export interface Recomputed {
	wpm: number;
	accuracy: number;
	seconds: number;
	/** Time between the first and last keystroke, plus a moment: the time actually spent typing. */
	activeSeconds: number;
}

export type Verdict = { kind: 'reject'; reason: string } | { kind: 'untrusted'; reason: string; stats: Recomputed | null } | { kind: 'trusted'; stats: Recomputed };

/** Fastest average interval between keystrokes any person sustains (about 480 WPM). */
const MIN_AVERAGE_MS = 25;
/** Most characters anyone types within one second (about 360 WPM). */
const MAX_PER_SECOND = 30;
/** Timing regularity below which a record looks generated: people vary far more. */
const MIN_VARIATION = 0.12;
/** How far the browser's figures may differ from the replay's (rounding to one decimal). */
const WPM_TOLERANCE = (wpm: number) => Math.max(1, wpm * 0.02);
const ACCURACY_TOLERANCE = 1;
const FUTURE_MS = 5 * 60 * 1000;

export function checkResult(r: ResultClaim, now = Date.now()): Verdict {
	if (r.at > now + FUTURE_MS) return { kind: 'reject', reason: 'from-the-future' };
	if (r.wpm > MAX_WPM) return { kind: 'reject', reason: 'impossible-speed' };
	const d = r.detail;
	if (!d) return { kind: 'untrusted', reason: 'no-keystroke-record', stats: null };

	const times = d.replay.map(([t]) => t);
	for (let i = 0; i < times.length; i++) {
		const t = times[i]!;
		if (!Number.isFinite(t) || t < 0 || (i > 0 && t < times[i - 1]!)) return { kind: 'reject', reason: 'keystrokes-out-of-order' };
	}
	const keystrokes = decodeKeystrokes(d.replay);
	const insertCount = keystrokes.filter((k) => k.kind === 'insert').length;
	if (insertCount !== d.keystrokes.total || keystrokes.length - insertCount !== d.keystrokes.backspaces) {
		return { kind: 'reject', reason: 'keystroke-counts' };
	}
	const span = times.length ? times.at(-1)! - times[0]! : 0;
	if (span > r.seconds * 1000 + 1500) return { kind: 'reject', reason: 'keystrokes-after-the-end' };

	// The figures the keystrokes actually produce, by the engine's own rules.
	const session = replaySession(d.targets, keystrokes);
	session.duration = r.seconds * 1000;
	const stats = computeStats(session);
	if (Math.abs(stats.wpm - r.wpm) > WPM_TOLERANCE(stats.wpm) || (insertCount > 0 && Math.abs(stats.accuracy - r.accuracy) > ACCURACY_TOLERANCE)) {
		return { kind: 'reject', reason: 'figures-do-not-match-keystrokes' };
	}
	if (stats.wpm > MAX_WPM) return { kind: 'reject', reason: 'impossible-speed' };

	// Physically impossible typing: a sustained rate or a one-second burst no person reaches.
	const insertTimes = keystrokes.filter((k) => k.kind === 'insert').map((k) => k.t);
	if (insertTimes.length >= 20) {
		const insertSpan = insertTimes.at(-1)! - insertTimes[0]!;
		if (insertSpan / (insertTimes.length - 1) < MIN_AVERAGE_MS) return { kind: 'reject', reason: 'faster-than-a-person' };
		for (let i = 0, j = 0; j < insertTimes.length; j++) {
			while (insertTimes[j]! - insertTimes[i]! >= 1000) i++;
			if (j - i + 1 > MAX_PER_SECOND) return { kind: 'reject', reason: 'burst-faster-than-a-person' };
		}
	}

	const recomputed: Recomputed = {
		wpm: stats.wpm,
		accuracy: stats.accuracy,
		seconds: r.seconds,
		activeSeconds: Math.min(r.seconds, span / 1000 + 3)
	};

	// Generated timing: intervals as regular as a metronome.
	if (times.length >= 41) {
		const gaps = times.slice(1).map((t, i) => t - times[i]!);
		const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
		const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length);
		if (mean > 0 && sd / mean < MIN_VARIATION) return { kind: 'untrusted', reason: 'machine-regular-timing', stats: recomputed };
	}
	return { kind: 'trusted', stats: recomputed };
}

/**
 * Stars a lesson attempt may claim for its average accuracy, by the course's own rule
 * (lib/courses/progression.ts): 3 from 98 %, 2 from 94 %, otherwise 1. An attempt whose graded
 * steps were all skipped reports 100 % and may claim 3.
 */
export function maxStarsFor(accuracy: number): number {
	return accuracy >= 98 ? 3 : accuracy >= 94 ? 2 : 1;
}
