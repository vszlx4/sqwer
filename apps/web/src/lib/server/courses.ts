import { eq } from 'drizzle-orm';
import type { LessonProgress } from '#lib/courses/types.ts';
import { db, schema } from './db/index.ts';

/** The learner's course progress, practice days and settings, as the course store expects them. */
export async function loadCourses(userId: string) {
	const d = await db();
	const [rows, days, state] = await Promise.all([
		d.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, userId)),
		d.select({ day: schema.courseDays.day }).from(schema.courseDays).where(eq(schema.courseDays.userId, userId)),
		d.select().from(schema.courseState).where(eq(schema.courseState.userId, userId))
	]);
	const progress: Record<string, LessonProgress> = {};
	for (const r of rows) {
		progress[r.lessonId] = {
			stars: r.stars,
			bestAccuracy: r.bestAccuracy,
			bestWpm: r.bestWpm,
			attempts: r.attempts,
			completedAt: r.completedAt?.getTime() ?? null
		};
	}
	return {
		progress,
		days: days.map((r) => r.day).sort(),
		state: { level: state[0]?.level ?? null, startLesson: state[0]?.startLesson ?? null }
	};
}
