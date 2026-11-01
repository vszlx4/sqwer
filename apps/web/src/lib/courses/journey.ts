import { LESSONS } from './catalog.ts';
import { RANKS, THREE_STARS_AT, lessonPoints, rankFor, type Rank } from './progression.ts';

/* Rough road to each rank for a steady learner, for the landing timeline. Estimates, not promises. */

/** Stars a steady learner earns per lesson. */
export const TYPICAL_STARS = 2;
/** Minutes per lesson; the catalog aims for 5 to 8. */
export const LESSON_MINUTES = 6.5;

export interface RankStop {
	rank: Rank;
	/** Lessons completed when the rank is reached. */
	lessons: number;
	/** Course time to get there, in minutes. */
	minutes: number;
	/** Speed and accuracy expected there, from the chapter's check; null before the first lesson. */
	wpm: number | null;
	accuracy: number | null;
}

/** The check target of the chapter a lesson belongs to. */
function checkFor(order: number) {
	const chapter = LESSONS[order - 1]!.chapter;
	for (const l of LESSONS) {
		const step = l.steps[0];
		if (l.chapter === chapter && step?.kind === 'checkpoint') return { wpm: step.minWpm, accuracy: step.minAccuracy };
	}
	return null;
}

function stop(rank: Rank, lessons: number, accuracy?: number): RankStop {
	const check = lessons > 0 ? checkFor(lessons) : null;
	return { rank, lessons, minutes: lessons * LESSON_MINUTES, wpm: check?.wpm ?? null, accuracy: accuracy ?? check?.accuracy ?? null };
}

/** One stop per rank. Legend needs three stars nearly everywhere, so it sits at the end at three-star accuracy. */
export function rankJourney(): RankStop[] {
	const reached = new Map<number, number>();
	for (let n = 0; n <= LESSONS.length; n++) {
		const { rank } = rankFor(n * lessonPoints(TYPICAL_STARS), Array(n).fill(TYPICAL_STARS));
		for (const r of RANKS) if (r.level <= rank.level && !reached.has(r.level)) reached.set(r.level, n);
	}
	return RANKS.map((r) =>
		r.level === 10 ? stop(r, LESSONS.length, THREE_STARS_AT) : stop(r, reached.get(r.level) ?? LESSONS.length)
	);
}

/** "15 min" under an hour, then whole hours. */
export function roughTime(minutes: number): string {
	if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`;
	return `${Math.round(minutes / 60)} h`;
}
