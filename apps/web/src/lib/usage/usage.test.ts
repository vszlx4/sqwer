import { describe, expect, it } from 'vitest';
import { emptyUsage, mergeUsage, wordHighlights } from './types.ts';

describe('mergeUsage', () => {
	it('adds counters across devices without losing per-exam and per-word detail', () => {
		const a = emptyUsage();
		a.activeMs = 1000;
		a.tests = { started: 3, completed: 2, abandoned: 1, ms: 50_000, byExam: { placement: { started: 3, completed: 2, abandoned: 1, ms: 50_000 } } };
		a.words = { the: { n: 4, ok: 4, sumWpm: 400, bestWpm: 120 } };
		a.hours[9] = 1000;
		const b = emptyUsage();
		b.activeMs = 500;
		b.tests = { started: 1, completed: 1, abandoned: 0, ms: 10_000, byExam: { placement: { started: 1, completed: 1, abandoned: 0, ms: 10_000 } } };
		b.words = { the: { n: 1, ok: 1, sumWpm: 90, bestWpm: 90 } };
		const m = mergeUsage([a, b]);
		expect(m.activeMs).toBe(1500);
		expect(m.tests.started).toBe(4);
		expect(m.tests.byExam.placement).toEqual({ started: 4, completed: 3, abandoned: 1, ms: 60_000 });
		expect(m.words.the).toEqual({ n: 5, ok: 5, sumWpm: 490, bestWpm: 120 });
		expect(m.hours[9]).toBe(1000);
	});
});

describe('wordHighlights', () => {
	it('uses only reliable samples for slowest and least accurate words', () => {
		const h = wordHighlights({
			a: { n: 50, ok: 50, sumWpm: 5000, bestWpm: 200 },
			quick: { n: 3, ok: 2, sumWpm: 150, bestWpm: 70 },
			brown: { n: 4, ok: 4, sumWpm: 360, bestWpm: 110 },
			zebra: { n: 1, ok: 1, sumWpm: 20, bestWpm: 20 }
		});
		expect(h.mostTyped?.word).toBe('a');
		// "a" is too short to rank by speed.
		expect(h.fastest?.word).toBe('brown');
		// "zebra" has only one attempt, so it is not the slowest.
		expect(h.slowest?.word).toBe('quick');
		expect(h.leastAccurate?.word).toBe('quick');
	});
});
