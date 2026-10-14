import { results } from '#lib/results/store.svelte.ts';
import { nextStep, onboarded, startingLesson, type PathInput } from './path.ts';
import { courses } from './store.svelte.ts';

/** The learner's current situation, read from the course and results stores. Reactive when read in components. */
export function pathInput(): PathInput {
	const placements = results.forExam('placement');
	const last = placements[placements.length - 1];
	return {
		level: courses.level,
		placement: last ? { wpm: last.wpm, accuracy: last.accuracy } : null,
		progress: courses.progress,
		startLesson: courses.startLesson
	};
}

export const learnerNextStep = () => nextStep(pathInput());
export const learnerOnboarded = () => onboarded(pathInput());
export const learnerStart = () => startingLesson(pathInput());
