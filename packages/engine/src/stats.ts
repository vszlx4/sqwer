import { replaySession, type Keystroke, type TypingSession } from './session.ts';

export interface CharCounts {
	/** Characters typed correctly in their position. */
	correct: number;
	/** Characters typed incorrectly in their position. */
	incorrect: number;
	/** Characters typed beyond the end of a word. */
	extra: number;
	/** Characters left out of words that were submitted early. */
	missed: number;
}

export interface TimelinePoint {
	/** Seconds since the first keystroke (the last point may be fractional). */
	second: number;
	/** Net speed up to this point, by the same rule as the final WPM. */
	wpm: number;
	/** Raw speed up to this point, by the same rule as the final raw speed. */
	raw: number;
	/** Keystroke accuracy up to this point, in percent. */
	accuracy: number;
	/** Keystroke speed within this second alone. */
	burst: number;
	/** Incorrect keystrokes within this second. */
	errors: number;
}

export interface WordStat {
	index: number;
	target: string;
	typed: string;
	/** Time from the end of the previous word to the end of this one, including its space. */
	ms: number;
	/** Speed for this word alone. */
	wpm: number;
	correct: boolean;
	submitted: boolean;
}

export interface TestStats {
	wpm: number;
	raw: number;
	/** Keystroke accuracy: corrected mistakes still count against it. */
	accuracy: number;
	consistency: number;
	chars: CharCounts;
	seconds: number;
	timeline: TimelinePoint[];
	words: WordStat[];
	keystrokes: { total: number; incorrect: number; backspaces: number };
}

const wpmOf = (chars: number, ms: number) => (ms > 0 ? (chars / 5) * (60000 / ms) : 0);

/** Kogasa: maps a coefficient of variation onto 0–100 (as Monkeytype does). */
export function kogasa(cov: number): number {
	return 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5));
}

export function consistencyOf(samples: number[]): number {
	if (samples.length < 2) return samples.length ? 100 : 0;
	const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
	if (mean === 0) return 0;
	const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
	return Math.max(0, kogasa(sd / mean));
}

/** The last word index that has any state worth counting. */
function lastWord(s: TypingSession) {
	return Math.min(s.wordIndex, s.targets.length - 1);
}

/**
 * Net characters: each submitted word typed exactly right counts with its
 * space; a word in progress counts only if it is correct so far.
 */
export function netChars(s: TypingSession): number {
	let n = 0;
	for (let i = 0; i <= lastWord(s); i++) {
		const target = s.targets[i]!;
		const input = s.inputs[i]!;
		if (s.isSubmitted(i)) {
			if (input === target) n += target.length + (i < s.wordIndex ? 1 : 0);
		} else if (target.startsWith(input)) {
			n += input.length;
		}
	}
	return n;
}

/** Raw characters: everything currently typed, including errors and extras, plus the spaces typed. */
export function rawChars(s: TypingSession): number {
	let n = 0;
	for (let i = 0; i <= lastWord(s); i++) n += s.inputs[i]!.length + (i < s.wordIndex ? 1 : 0);
	return n;
}

export function countChars(s: TypingSession): CharCounts {
	const counts: CharCounts = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
	for (let i = 0; i <= lastWord(s); i++) {
		const target = s.targets[i]!;
		const input = s.inputs[i]!;
		for (let j = 0; j < input.length; j++) {
			if (j >= target.length) counts.extra++;
			else if (input[j] === target[j]) counts.correct++;
			else counts.incorrect++;
		}
		if (s.isSubmitted(i) && input.length < target.length) counts.missed += target.length - input.length;
	}
	return counts;
}

/** Per-word timings, attributing each keystroke to the word it was typed in. */
export function wordStats(s: TypingSession): WordStat[] {
	const end = new Map<number, number>();
	for (const k of s.keystrokes) end.set(k.word, Math.max(end.get(k.word) ?? 0, k.t));
	const out: WordStat[] = [];
	let previousEnd = 0;
	for (let i = 0; i <= lastWord(s); i++) {
		const finish = end.get(i);
		if (finish === undefined) continue;
		const submitted = s.isSubmitted(i);
		const ms = Math.max(1, finish - previousEnd);
		previousEnd = finish;
		const target = s.targets[i]!;
		const input = s.inputs[i]!;
		const typedChars = input.length + (i < s.wordIndex ? 1 : 0);
		out.push({
			index: i,
			target,
			typed: input,
			ms,
			wpm: wpmOf(typedChars, ms),
			correct: input === target,
			submitted
		});
	}
	return out;
}

/** Statistics at time `ms`, by replaying the keystrokes recorded up to then. */
function pointAt(targets: string[], keystrokes: Keystroke[], ms: number) {
	const s = replaySession(targets, keystrokes, ms);
	const inserts = keystrokes.filter((k) => k.kind === 'insert' && k.t <= ms);
	const correct = inserts.filter((k) => k.correct).length;
	return {
		wpm: wpmOf(netChars(s), ms),
		raw: wpmOf(rawChars(s), ms),
		accuracy: inserts.length ? (correct / inserts.length) * 100 : 100
	};
}

export function computeStats(session: TypingSession): TestStats {
	const ms = session.duration ?? 0;
	const inserts = session.keystrokes.filter((k) => k.kind === 'insert');
	const incorrect = inserts.filter((k) => !k.correct).length;

	const seconds = Math.max(1, Math.ceil(ms / 1000));
	const strokesPer = new Array<number>(seconds).fill(0);
	const errorsPer = new Array<number>(seconds).fill(0);
	for (const k of inserts) {
		const i = Math.min(seconds - 1, Math.floor(k.t / 1000));
		strokesPer[i]!++;
		if (!k.correct) errorsPer[i]!++;
	}

	const timeline: TimelinePoint[] = [];
	const bursts: number[] = [];
	for (let i = 0; i < seconds; i++) {
		const at = Math.min(ms, (i + 1) * 1000);
		const span = at - i * 1000 || 1000;
		const burst = wpmOf(strokesPer[i]!, span);
		bursts.push(burst);
		timeline.push({ second: at / 1000, ...pointAt(session.targets, session.keystrokes, at), burst, errors: errorsPer[i]! });
	}

	const result: TestStats = {
		wpm: wpmOf(netChars(session), ms),
		raw: wpmOf(rawChars(session), ms),
		accuracy: inserts.length ? ((inserts.length - incorrect) / inserts.length) * 100 : 0,
		consistency: consistencyOf(bursts),
		chars: countChars(session),
		seconds: ms / 1000,
		timeline,
		words: wordStats(session),
		keystrokes: {
			total: inserts.length,
			incorrect,
			backspaces: session.keystrokes.length - inserts.length
		}
	};

	// The final timeline point is computed from a replay; pin it to the session's own result
	// so that rounding can never make the chart disagree with the headline numbers.
	const last = timeline[timeline.length - 1];
	if (last && ms > 0) {
		last.wpm = result.wpm;
		last.raw = result.raw;
		last.accuracy = result.accuracy;
	}
	return result;
}

/** Live net WPM while a test is running, by the same rule as the final result. */
export function liveWpm(session: TypingSession, now: number): number {
	if (session.startedAt === null) return 0;
	return wpmOf(netChars(session), now - session.startedAt);
}
