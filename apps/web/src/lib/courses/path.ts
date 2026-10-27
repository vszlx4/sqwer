import { CHAPTERS, LESSONS, lessonById } from './catalog.ts';
import { nextLessonId, recommendedChapter } from './progression.ts';
import type { Level } from './state.ts';
import type { Lesson, LessonProgress } from './types.ts';

/*
 * Learner path. Getting started is one-time (typing level, optional placement); then the course leads.
 * Every next-action suggestion uses this.
 */

export interface PathInput {
	level: Level | null;
	/** The most recent placement test, if any. */
	placement: { wpm: number; accuracy: number } | null;
	progress: Record<string, LessonProgress>;
	startLesson: string | null;
}

export type Stage = 'welcome' | 'placement' | 'course' | 'complete';

export interface NextStep {
	stage: Stage;
	title: string;
	text: string;
	href: string;
	action: string;
	lesson: Lesson | null;
}

/** Getting started done: beginner, placement result, chosen start chapter or a completed lesson. */
export const onboarded = (i: PathInput) =>
	i.level === 'new' || (i.level !== null && i.placement !== null) || i.startLesson !== null || Object.keys(i.progress).length > 0;

/** Where the course begins: the learner's choice, otherwise their placement. */
export function startingLesson(i: PathInput): string {
	if (i.startLesson && lessonById(i.startLesson)) return i.startLesson;
	if (i.level !== 'new' && i.placement) {
		const chapter = recommendedChapter(i.placement.wpm, i.placement.accuracy);
		return CHAPTERS.find((c) => c.number === chapter)!.lessons[0]!.id;
	}
	return LESSONS[0]!.id;
}

export function nextStep(i: PathInput): NextStep {
	if (!i.level && !onboarded(i)) {
		return {
			stage: 'welcome',
			title: 'Find your starting point',
			text: 'Answer one question, and sqwer recommends where to begin.',
			href: '/start',
			action: 'Get started',
			lesson: null
		};
	}
	if (!onboarded(i)) {
		return {
			stage: 'placement',
			title: 'Take the placement test',
			text: 'One minute of typing shows where in the course you should begin.',
			href: '/test?exam=placement',
			action: 'Take the placement test',
			lesson: null
		};
	}
	const id = nextLessonId(i.progress, startingLesson(i));
	if (!id) {
		return {
			stage: 'complete',
			title: 'You have completed the course',
			text: 'Keep your skills sharp with the examinations, or replay any lesson for more stars.',
			href: '/exams',
			action: 'Practise with examinations',
			lesson: null
		};
	}
	const lesson = lessonById(id)!;
	const begun = Object.keys(i.progress).length > 0;
	return {
		stage: 'course',
		title: `Lesson ${lesson.order}: ${lesson.title}`,
		text: lesson.summary,
		href: `/learn/${lesson.id}`,
		action: begun ? `Continue: ${lesson.title}` : `Start lesson ${lesson.order}: ${lesson.title}`,
		lesson
	};
}
