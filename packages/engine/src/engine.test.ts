import { describe, expect, it } from 'vitest';
import { computeStats, consistencyOf, TypingSession } from './index.ts';

/** Type `text` with a fixed gap between keystrokes, starting at t=0. */
function typeAll(session: TypingSession, text: string, gap = 100, start = 0) {
	let t = start;
	for (const ch of text) {
		if (ch === '\b') session.backspace(t);
		else session.type(ch, t);
		t += gap;
	}
	return t;
}

describe('TypingSession', () => {
	it('finishes a words test when the last word is typed correctly', () => {
		const s = new TypingSession(['hi', 'yo'], { kind: 'words', count: 2 });
		typeAll(s, 'hi yo');
		expect(s.finished).toBe(true);
		expect(s.duration).toBe(400);
	});

	it('finishes a words test when space is pressed early on the last word, counting missed letters', () => {
		const s = new TypingSession(['hi', 'you'], { kind: 'words', count: 2 });
		typeAll(s, 'hi y ');
		expect(s.finished).toBe(true);
		expect(computeStats(s).chars.missed).toBe(2);
	});

	it('ignores a leading space', () => {
		const s = new TypingSession(['hi'], { kind: 'words', count: 1 });
		expect(s.type(' ', 0)).toBe('ignored');
		expect(s.started).toBe(false);
	});

	it('only lets backspace return to a word with mistakes', () => {
		const s = new TypingSession(['ab', 'cd', 'ef'], { kind: 'words', count: 3 });
		typeAll(s, 'ab ');
		expect(s.backspace(500)).toBe(false);
		expect(s.wordIndex).toBe(1);

		typeAll(s, 'cx ', 100, 600);
		expect(s.wordIndex).toBe(2);
		expect(s.backspace(1000)).toBe(true);
		expect(s.wordIndex).toBe(1);
		expect(s.currentInput).toBe('cx');
	});

	it('caps extra characters', () => {
		const s = new TypingSession(['a', 'b'], { kind: 'words', count: 2 });
		typeAll(s, 'a'.repeat(20));
		expect(s.currentInput.length).toBe(11);
	});

	it('reports the next and previous characters', () => {
		const s = new TypingSession(['ab', 'c'], { kind: 'words', count: 2 });
		expect(s.nextChar).toBe('a');
		typeAll(s, 'ab');
		expect(s.nextChar).toBe(' ');
		expect(s.prevChar).toBe('b');
	});

	it('clamps a time test to its duration', () => {
		const s = new TypingSession(['a', 'b'], { kind: 'time', seconds: 1 });
		s.type('a', 0);
		s.finish(1350);
		expect(s.duration).toBe(1000);
	});
});

describe('computeStats', () => {
	it('computes perfect-run WPM from correct words and spaces', () => {
		// 4 words of 4 letters = 16 chars + 3 spaces = 19 chars over 1.8 s.
		const s = new TypingSession(['abcd', 'efgh', 'ijkl', 'mnop'], { kind: 'words', count: 4 });
		typeAll(s, 'abcd efgh ijkl mnop');
		const stats = computeStats(s);
		expect(s.duration).toBe(1800);
		expect(stats.wpm).toBeCloseTo((19 / 5) * (60 / 1.8), 5);
		expect(stats.raw).toBeCloseTo(stats.wpm, 5);
		expect(stats.accuracy).toBe(100);
		expect(stats.chars).toEqual({ correct: 16, incorrect: 0, extra: 0, missed: 0 });
	});

	it('excludes incorrect words from WPM but not from raw', () => {
		const s = new TypingSession(['ab', 'cd'], { kind: 'words', count: 2 });
		typeAll(s, 'ax cd');
		const stats = computeStats(s);
		expect(stats.wpm).toBeLessThan(stats.raw);
		expect(stats.chars).toEqual({ correct: 3, incorrect: 1, extra: 0, missed: 0 });
	});

	it('counts corrected mistakes against accuracy', () => {
		const s = new TypingSession(['ab', 'cd'], { kind: 'words', count: 2 });
		typeAll(s, 'ax\bb cd');
		const stats = computeStats(s);
		expect(s.finished).toBe(true);
		// 6 keystrokes (a, x, b, space, c, d), one of them wrong.
		expect(stats.accuracy).toBeCloseTo((5 / 6) * 100, 5);
		expect(stats.chars.incorrect).toBe(0);
		expect(stats.keystrokes).toEqual({ total: 6, incorrect: 1, backspaces: 1 });
	});

	it('ends a words test when the last word reaches its length, even with errors', () => {
		const s = new TypingSession(['ab', 'cd'], { kind: 'words', count: 2 });
		typeAll(s, 'ab cx');
		expect(s.finished).toBe(true);
		const stats = computeStats(s);
		expect(stats.chars).toEqual({ correct: 3, incorrect: 1, extra: 0, missed: 0 });
		// Only "ab " is correct: 3 characters.
		expect(stats.wpm).toBeCloseTo((3 / 5) * (60000 / 400), 5);
	});

	it('does not count keystrokes made after the time limit', () => {
		const s = new TypingSession(['aaaa', 'bbbb'], { kind: 'time', seconds: 1 });
		s.type('a', 0);
		s.type('a', 900);
		expect(s.type('a', 1050)).toBe('ignored');
		expect(s.finished).toBe(true);
		expect(s.duration).toBe(1000);
		expect(computeStats(s).keystrokes.total).toBe(2);
	});

	it('ends every timeline at exactly the final result', () => {
		const s = new TypingSession(['the', 'quick', 'brown', 'fox', 'jumps'], { kind: 'time', seconds: 3 });
		typeAll(s, 'the quixk\\ck brwn fox jum', 110);
		s.finish(3000);
		const stats = computeStats(s);
		const last = stats.timeline[stats.timeline.length - 1]!;
		expect(last.second).toBe(3);
		expect(last.wpm).toBe(stats.wpm);
		expect(last.raw).toBe(stats.raw);
		expect(last.accuracy).toBe(stats.accuracy);
		// Earlier points come from replaying the same keystrokes with the same rules.
		expect(stats.timeline[0]!.wpm).toBeGreaterThanOrEqual(0);
		expect(stats.timeline.every((p) => p.accuracy >= 0 && p.accuracy <= 100)).toBe(true);
	});

	it('times each word from the end of the previous one', () => {
		const s = new TypingSession(['ab', 'cd', 'ef'], { kind: 'words', count: 3 });
		typeAll(s, 'ab cd ef', 100);
		const words = computeStats(s).words;
		expect(words.map((w) => w.ms)).toEqual([200, 300, 200]);
		expect(words.every((w) => w.correct)).toBe(true);
		// "cd " is 3 characters in 300 ms.
		expect(words[1]!.wpm).toBeCloseTo((3 / 5) * (60000 / 300), 5);
	});

	it('counts extra and missed characters', () => {
		const s = new TypingSession(['abc', 'de', 'f'], { kind: 'words', count: 3 });
		typeAll(s, 'ab dex f');
		expect(computeStats(s).chars).toEqual({ correct: 5, incorrect: 0, extra: 1, missed: 1 });
	});

	it('builds a per-second timeline', () => {
		const s = new TypingSession(['aaaa', 'bbbb'], { kind: 'time', seconds: 3 });
		typeAll(s, 'aaaa bbbb', 300);
		s.finish(3000);
		const stats = computeStats(s);
		expect(stats.timeline).toHaveLength(3);
		expect(stats.timeline.reduce((n, x) => n + x.errors, 0)).toBe(0);
		expect(stats.seconds).toBe(3);
	});
});

describe('consistencyOf', () => {
	it('is 100 for perfectly even speed and drops with variation', () => {
		expect(consistencyOf([60, 60, 60])).toBeCloseTo(100, 5);
		expect(consistencyOf([30, 90, 30, 90])).toBeLessThan(60);
	});
});
