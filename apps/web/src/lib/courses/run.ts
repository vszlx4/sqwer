import type { StepResult } from './types.ts';

/*
 * Lesson runs: each finished step is kept on this device until the lesson is finished, so a lesson can be left
 * and picked up again, and finished steps can be redone. Browser only.
 */

const KEY = 'sqwer:lesson-runs';

/** One slot per step: its latest finished result, or null. */
export type Run = (StepResult | null)[];

function readAll(): Record<string, Run> {
	try {
		const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
		return all && typeof all === 'object' && !Array.isArray(all) ? (all as Record<string, Run>) : {};
	} catch {
		return {};
	}
}

function writeAll(all: Record<string, Run>) {
	try {
		if (Object.keys(all).length) localStorage.setItem(KEY, JSON.stringify(all));
		else localStorage.removeItem(KEY);
	} catch {
		// Storage unavailable: the run lasts for this visit only.
	}
}

/** The saved run of a lesson, sized to its steps; empty when none is saved, it was finished or the lesson changed. */
export function loadRun(lessonId: string, steps: number): Run {
	const saved = readAll()[lessonId];
	const run: Run = Array.isArray(saved) && saved.length === steps ? saved.map((r) => (r && typeof r === 'object' && typeof r.passed === 'boolean' ? r : null)) : [];
	// A finished run was already recorded; the next visit starts a new one.
	return run.length && !run.every(Boolean) ? run : Array(steps).fill(null);
}

export function saveRun(lessonId: string, run: Run) {
	const all = readAll();
	if (run.some(Boolean)) all[lessonId] = run;
	else delete all[lessonId];
	writeAll(all);
}

export function clearRun(lessonId: string) {
	saveRun(lessonId, []);
}

/** Drops every saved run, when learning data is cleared. */
export function clearRuns() {
	writeAll({});
}

/** The next step without a result: after `from` first, then from the start. -1 when every step is done. */
export function nextOpen(run: Run, from: number): number {
	for (let i = from + 1; i < run.length; i++) if (!run[i]) return i;
	return run.findIndex((r) => !r);
}

/** The first step without a result, where a saved lesson resumes; 0 when every step is done. */
export const resumeAt = (run: Run) => Math.max(0, run.findIndex((r) => !r));

/**
 * Steps that can be picked: every step of a lesson finished before, otherwise the finished ones and the step
 * the learner has reached. Steps ahead stay closed.
 */
export const canPick = (run: Run, index: number, current: number, finishedBefore: boolean) =>
	finishedBefore || index === current || !!run[index] || index === run.findIndex((r) => !r);
