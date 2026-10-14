import { replaySession, type Keystroke, type TestStats, type TypingSession } from '@sqwer/engine';
import type { ReplayEvent, ResultDetail } from './types.ts';

const DELETE = '\b';
const DELETE_WORD = '\u0017';
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Compact, complete description of a test, enough to redraw every chart and replay it. */
export function toDetail(session: TypingSession, stats: TestStats): ResultDetail {
	const reached = Math.min(session.targets.length, session.wordIndex + 1);
	const missedKeys: Record<string, number> = {};
	for (const k of session.keystrokes) {
		if (k.kind === 'insert' && !k.correct && k.expected !== undefined) {
			missedKeys[k.expected] = (missedKeys[k.expected] ?? 0) + 1;
		}
	}
	return {
		timeline: stats.timeline.map((p) => ({
			s: r1(p.second),
			wpm: r1(p.wpm),
			raw: r1(p.raw),
			acc: r1(p.accuracy),
			burst: r1(p.burst),
			err: p.errors
		})),
		words: stats.words.map((w) => ({ w: w.target, t: w.typed, ms: Math.round(w.ms), wpm: r1(w.wpm), ok: w.correct })),
		targets: session.targets.slice(0, reached),
		replay: session.keystrokes.map((k): ReplayEvent => [
			Math.round(k.t),
			k.kind === 'insert' ? k.char! : k.whole ? DELETE_WORD : DELETE
		]),
		chars: stats.chars,
		keystrokes: stats.keystrokes,
		missedKeys
	};
}

export function decodeKeystrokes(events: ReplayEvent[]): Keystroke[] {
	return events.map(([t, c]) =>
		c === DELETE || c === DELETE_WORD
			? { t, kind: 'delete', word: 0, whole: c === DELETE_WORD }
			: { t, kind: 'insert', char: c, word: 0 }
	);
}

/** The session as it stood `ms` milliseconds into the test. */
export function sessionAt(detail: ResultDetail, ms: number): TypingSession {
	return replaySession(detail.targets, decodeKeystrokes(detail.replay), ms);
}
