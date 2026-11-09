import { beforeEach, describe, expect, it } from 'vitest';
import { best, canPick, clearRun, clearRuns, loadRun, nextOpen, resumeAt, saveRun, type Run } from './run.ts';
import type { StepResult } from './types.ts';

const ok: StepResult = { passed: true, accuracy: 95, summary: 'ok' };

beforeEach(() => {
	const data = new Map<string, string>();
	globalThis.localStorage = {
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v),
		removeItem: (k: string) => void data.delete(k),
		clear: () => data.clear(),
		key: () => null,
		get length() {
			return data.size;
		}
	} as Storage;
});

describe('lesson runs', () => {
	it('moves to the next open step, then wraps to earlier ones, then ends', () => {
		const run: Run = [ok, null, ok, null];
		expect(nextOpen(run, 0)).toBe(1);
		expect(nextOpen(run, 1)).toBe(3);
		expect(nextOpen(run, 3)).toBe(1);
		expect(nextOpen([ok, ok, ok], 1)).toBe(-1);
	});

	it('resumes at the first open step', () => {
		expect(resumeAt([ok, ok, null, null])).toBe(2);
		expect(resumeAt([null, null])).toBe(0);
		expect(resumeAt([ok, ok])).toBe(0);
	});

	it('opens finished steps and the current one, never steps ahead', () => {
		const run: Run = [ok, ok, null, null];
		expect(canPick(run, 0, 2, false)).toBe(true);
		expect(canPick(run, 2, 2, false)).toBe(true);
		expect(canPick(run, 3, 2, false)).toBe(false);
		// While redoing step 0, the step reached before stays open; the ones after it do not.
		expect(canPick(run, 1, 0, false)).toBe(true);
		expect(canPick(run, 2, 0, false)).toBe(true);
		expect(canPick(run, 3, 0, false)).toBe(false);
		expect(canPick(run, 3, 2, true)).toBe(true);
	});

	it('saves each finished step and restores it', () => {
		saveRun('l001', [ok, null, null]);
		expect(loadRun('l001', 3)).toEqual([ok, null, null]);
		expect(loadRun('l002', 3)).toEqual([null, null, null]);
	});

	it('starts over when the run was finished, the lesson changed or the data is broken', () => {
		saveRun('l001', [ok, ok]);
		expect(loadRun('l001', 2)).toEqual([null, null]);
		saveRun('l001', [ok, null]);
		expect(loadRun('l001', 3)).toEqual([null, null, null]);
		localStorage.setItem('sqwer:lesson-runs', '{"l001":[{"x":1},null]}');
		expect(loadRun('l001', 2)).toEqual([null, null]);
		localStorage.setItem('sqwer:lesson-runs', 'not json');
		expect(loadRun('l001', 2)).toEqual([null, null]);
	});

	it('keeps the better result when a step is redone', () => {
		const good: StepResult = { passed: true, accuracy: 97, wpm: 20, summary: 'good' };
		const worse: StepResult = { passed: true, accuracy: 91, wpm: 30, summary: 'worse' };
		const faster: StepResult = { passed: true, accuracy: 97, wpm: 24, summary: 'faster' };
		const skipped: StepResult = { passed: true, graded: false, accuracy: 0, summary: 'skipped' };
		expect(best(null, worse)).toBe(worse);
		expect(best(good, worse)).toBe(good);
		expect(best(worse, good)).toBe(good);
		expect(best(good, faster)).toBe(faster);
		expect(best(skipped, worse)).toBe(worse);
		expect(best(worse, skipped)).toBe(worse);
	});

	it('clears one lesson or all of them', () => {
		saveRun('l001', [ok, null]);
		saveRun('l002', [ok, null]);
		clearRun('l001');
		expect(loadRun('l001', 2)).toEqual([null, null]);
		expect(loadRun('l002', 2)).toEqual([ok, null]);
		clearRuns();
		expect(localStorage.getItem('sqwer:lesson-runs')).toBeNull();
	});
});
