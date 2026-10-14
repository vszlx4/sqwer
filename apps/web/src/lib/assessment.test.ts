import { describe, expect, it } from 'vitest';
import { TypingSession } from '@sqwer/engine';
import { buildProfile, type FingerObservation } from '@sqwer/fingermap';
import { kindOf, qwertyAnsi } from '@sqwer/layouts';
import { fingerForChar, fingerScores, stagesFor, stageWords, standouts } from './assessment.ts';

const layout = qwertyAnsi('pc');

function typed(text: string, gap: number, wrongAt = -1) {
	const s = new TypingSession(text.split(' '), { kind: 'time', seconds: 20 });
	let t = 1000;
	[...text].forEach((ch, i) => {
		s.type(i === wrongAt ? 'x' : ch, t);
		if (i === wrongAt) {
			s.backspace(t + 1);
			s.type(ch, t + 2);
		}
		t += gap;
	});
	s.finish(t);
	return s;
}

describe('fingerForChar', () => {
	it('uses the typist’s own mapping before the standard finger', () => {
		const obs: FingerObservation[] = [0, 1, 2].map((i) => ({ code: 'KeyC', prev: null, next: null, finger: 'li', at: i }));
		const profile = buildProfile(obs, layout);
		expect(fingerForChar(layout, profile, 'c')).toBe('li');
		expect(fingerForChar(layout, null, 'c')).toBe('lm');
		expect(fingerForChar(layout, null, 'A')).toBe('lp');
	});
});

describe('fingerScores', () => {
	it('converts keystroke intervals into words per minute per finger', () => {
		// 120 ms between keystrokes = 12000 / 120 = 100 WPM.
		const { fingers } = fingerScores([typed('add sad dad', 120)], layout, null);
		expect(fingers.lp?.wpm).toBeCloseTo(100, 0);
		expect(fingers.lm?.wpm).toBeCloseTo(100, 0);
		// Space after a left-hand letter belongs to the right thumb.
		expect(fingers.rt?.keystrokes).toBe(2);
		expect(fingers.lp?.accuracy).toBe(100);
	});

	it('counts errors against the finger that should have typed the key', () => {
		const { fingers, accuracy } = fingerScores([typed('dad', 150, 0)], layout, null);
		expect(fingers.lm!.accuracy).toBeLessThan(100);
		expect(accuracy).toBeLessThan(100);
	});

	it('identifies the fastest and slowest fingers', () => {
		const s = standouts(
			{
				lp: { wpm: 40, accuracy: 95, keystrokes: 20 },
				li: { wpm: 90, accuracy: 99, keystrokes: 20 },
				rm: { wpm: 70, accuracy: 88, keystrokes: 20 }
			},
			8
		);
		expect(s?.slowest[0]).toBe('lp');
		expect(s?.fastest[0]).toBe('li');
		expect(s?.leastAccurate[0]).toBe('rm');
	});
});

describe('stageWords', () => {
	it('chooses words dominated by the requested finger', () => {
		const words = stageWords('pinky', layout, null, ['papa', 'quiz', 'tree', 'deed', 'zap', 'aqua'], () => 0.1, 20);
		const pinkyShare =
			words.join('').split('').filter((ch) => {
				const f = fingerForChar(layout, null, ch);
				return f && kindOf(f) === 'pinky';
			}).length / words.join('').length;
		expect(pinkyShare).toBeGreaterThan(0.4);
	});

	it('returns no words, and skips the stage, when no letter uses that finger', () => {
		// "t" and "g" are typed with the index finger, so there is nothing for the ring fingers.
		expect(stageWords('ring', layout, null, ['tt', 'gg'], () => 0.1, 20)).toEqual([]);
		expect(stagesFor(layout, null, ['tt', 'gg']).map((s) => s.kind)).toEqual(['index']);
	});
});
