import type { StepResult } from './types.ts';

/*
 * Adaptive pace. Every game and drill is scaled by one number: 1 is the standard pace, lower is
 * gentler (slower falling letters, longer key windows, slower pacers, lower accuracy goals) and
 * higher is brisker. It rises after confident steps and falls after failed ones, so the course
 * follows the learner rather than a fixed goal. It is kept only in this browser.
 */

const KEY = 'sqwer:pace';
export const MIN_PACE = 0.7;
export const MAX_PACE = 1.3;
const clamp = (n: number) => Math.min(MAX_PACE, Math.max(MIN_PACE, Math.round(n * 100) / 100));

class Pace {
	value = $state(1);

	constructor() {
		if (typeof localStorage === 'undefined') return;
		try {
			const saved = Number(localStorage.getItem(KEY));
			if (saved) this.value = clamp(saved);
		} catch {
			// Storage unavailable: the standard pace is used.
		}
	}

	private save() {
		try {
			localStorage.setItem(KEY, String(this.value));
		} catch {
			// Storage unavailable.
		}
	}

	/** Adjusts the pace after a step: up after confident passes, down after failures. */
	record(result: StepResult) {
		if (result.graded === false && result.passed) return;
		const delta = !result.passed ? -0.1 : result.accuracy >= 96 ? 0.05 : result.accuracy >= 90 ? 0.02 : -0.02;
		this.value = clamp(this.value + delta);
		this.save();
	}

	/** Makes the course gentler at the learner's request. */
	ease(by = 0.12) {
		this.value = clamp(this.value - by);
		this.save();
	}

	/** Returns to the standard pace, when the learning path starts again. */
	reset() {
		this.value = 1;
		try {
			localStorage.removeItem(KEY);
		} catch {
			// Storage unavailable.
		}
	}

	get label() {
		return this.value < 0.85 ? 'Gentle' : this.value > 1.12 ? 'Brisk' : 'Steady';
	}
}

export const pace = new Pace();
