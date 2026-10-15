import type { IconName } from '#lib/ui/Icon.svelte';
import type { Lesson, StepKind } from './types.ts';

/** How each kind of step is named and drawn wherever lessons are listed or played. */
export const STEP_INFO: Record<StepKind, { icon: IconName; label: string; game: boolean }> = {
	intro: { icon: 'hand', label: 'Meet the keys', game: false },
	drill: { icon: 'keyboard', label: 'Practice', game: false },
	checkpoint: { icon: 'flag', label: 'Checkpoint', game: false },
	listen: { icon: 'volume', label: 'Listen and type', game: false },
	falling: { icon: 'layers', label: 'Falling game', game: true },
	rhythm: { icon: 'volume', label: 'Rhythm game', game: true },
	keyhunt: { icon: 'target', label: 'Key hunt', game: true },
	race: { icon: 'gauge', label: 'Race', game: true },
	echo: { icon: 'repeat', label: 'Echo', game: true }
};

/** A rough duration, for planning: about a minute and a half per step. */
export const lessonMinutes = (lesson: Lesson) => Math.max(2, Math.round(lesson.steps.length * 1.5));

/** The games in a lesson, by name, without repeats. */
export const lessonGames = (lesson: Lesson) => [...new Set(lesson.steps.filter((s) => STEP_INFO[s.kind].game).map((s) => STEP_INFO[s.kind].label))];
