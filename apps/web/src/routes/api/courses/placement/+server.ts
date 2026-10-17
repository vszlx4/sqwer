import { error, json } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { and, eq, sql } from 'drizzle-orm';
import { CHAPTERS } from '#lib/courses/catalog.ts';
import { recommendedChapter } from '#lib/courses/progression.ts';
import { loadCourses } from '#lib/server/courses.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

/** Stars given for each lesson the placement test shows the learner has already mastered. */
const PLACED_STARS = 3;

/**
 * Applies the learner's latest placement test: every lesson in the chapters before the
 * recommended one is marked complete with full stars, which earns its points and XP, and the
 * recommended chapter becomes the starting point. The result is read from the saved placement
 * test on the server, never from the request, and only a test that passed the server's keystroke
 * check counts, so the credit cannot be claimed without the speed.
 */
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to save your level.');
	if (!rateLimit(`placement:${locals.user.id}`, 20, 60 * 60 * 1000).ok) error(429, 'Too many requests.');
	const userId = locals.user.id;
	const d = await db();
	const [latest] = await d
		.select({ wpm: schema.results.wpm, accuracy: sql<number>`(${schema.results.data}->>'accuracy')::float` })
		.from(schema.results)
		.where(and(eq(schema.results.userId, userId), eq(schema.results.exam, 'placement'), eq(schema.results.verified, true), sql`${schema.results.data}->>'status' = 'completed'`))
		.orderBy(sql`${schema.results.createdAt} desc`)
		.limit(1);
	if (!latest) error(400, 'Take the placement test while signed in first.');

	const chapter = recommendedChapter(latest.wpm, Number(latest.accuracy));
	const mastered = CHAPTERS.filter((c) => c.number < chapter).flatMap((c) => c.lessons);
	const existing = await d.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, userId));
	const byLesson = new Map(existing.map((r) => [r.lessonId, r]));
	const now = new Date();
	const rows = mastered
		.filter((l) => (byLesson.get(l.id)?.stars ?? 0) < PLACED_STARS)
		.map((l) => {
			const r = byLesson.get(l.id);
			return {
				userId,
				lessonId: l.id,
				stars: PLACED_STARS,
				bestAccuracy: Math.max(r?.bestAccuracy ?? 0, Math.round(Number(latest.accuracy))),
				bestWpm: Math.max(r?.bestWpm ?? 0, Math.round(Math.min(latest.wpm, 400))),
				attempts: r?.attempts ?? 0,
				completedAt: r?.completedAt ?? now,
				updatedAt: now
			};
		});
	if (rows.length) {
		await d
			.insert(schema.courseProgress)
			.values(rows)
			.onConflictDoUpdate({
				target: [schema.courseProgress.userId, schema.courseProgress.lessonId],
				set: {
					stars: sql`excluded.stars`,
					bestAccuracy: sql`excluded.best_accuracy`,
					bestWpm: sql`excluded.best_wpm`,
					completedAt: sql`excluded.completed_at`,
					updatedAt: sql`excluded.updated_at`
				}
			});
	}
	const startLesson = CHAPTERS.find((c) => c.number === chapter)!.lessons[0]!.id;
	await d
		.insert(schema.courseState)
		.values({ userId, level: null, startLesson, updatedAt: now })
		.onConflictDoUpdate({ target: schema.courseState.userId, set: { startLesson, updatedAt: now } });
	track('placement_applied', { userId, props: { chapter } });
	return json({ chapter, credited: rows.length, snapshot: await loadCourses(userId) });
};
