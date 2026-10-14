import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { lessonById } from '#lib/courses/catalog.ts';
import { LEVELS } from '#lib/courses/state.ts';
import type { LessonProgress } from '#lib/courses/types.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

const lessonId = z.string().refine((id) => !!lessonById(id), 'Unknown lesson');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const resultSchema = z.object({
	lessonId,
	stars: z.number().int().min(0).max(3),
	accuracy: z.number().min(0).max(100),
	// Speeds beyond human range are capped rather than rejected, so a lesson is never lost.
	wpm: z.number().min(0).max(5000).transform((v) => Math.min(v, 400)),
	day
});

const stateSchema = z.object({
	level: z.enum(LEVELS).nullable().optional(),
	startLesson: lessonId.nullable().optional()
});

async function load(userId: string) {
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

/** The learner's course progress, practice days and settings. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to view your course progress.');
	return json(await load(locals.user.id));
};

/** Records a lesson attempt, keeping the best stars, accuracy and speed. */
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Sign in to save your course progress.');
	if (!rateLimit(`courses:${locals.user.id}`, 300, 60 * 60 * 1000).ok) error(429, 'Too many requests.');
	const parsed = resultSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'The lesson result is not valid.');
	const r = parsed.data;
	const userId = locals.user.id;
	const d = await db();
	const now = new Date();
	const [existing] = await d
		.select()
		.from(schema.courseProgress)
		.where(and(eq(schema.courseProgress.userId, userId), eq(schema.courseProgress.lessonId, r.lessonId)));

	const completed = r.stars > 0;
	const next = {
		stars: Math.max(existing?.stars ?? 0, r.stars),
		bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, completed ? Math.round(r.accuracy) : 0),
		bestWpm: Math.max(existing?.bestWpm ?? 0, completed ? Math.round(r.wpm) : 0),
		attempts: (existing?.attempts ?? 0) + 1,
		completedAt: existing?.completedAt ?? (completed ? now : null),
		updatedAt: now
	};
	await d
		.insert(schema.courseProgress)
		.values({ userId, lessonId: r.lessonId, ...next })
		.onConflictDoUpdate({ target: [schema.courseProgress.userId, schema.courseProgress.lessonId], set: next });
	if (completed) await d.insert(schema.courseDays).values({ userId, day: r.day }).onConflictDoNothing();
	return json(await load(userId));
};

/** Saves the learner's level and chosen starting lesson. */
export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Sign in to save your course settings.');
	if (!rateLimit(`courses-state:${locals.user.id}`, 60, 60 * 60 * 1000).ok) error(429, 'Too many requests.');
	const parsed = stateSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'The course settings are not valid.');
	const set: { level?: string | null; startLesson?: string | null; updatedAt: Date } = { updatedAt: new Date() };
	if (parsed.data.level !== undefined) set.level = parsed.data.level;
	if (parsed.data.startLesson !== undefined) set.startLesson = parsed.data.startLesson;
	await (await db())
		.insert(schema.courseState)
		.values({ userId: locals.user.id, level: set.level ?? null, startLesson: set.startLesson ?? null, updatedAt: set.updatedAt })
		.onConflictDoUpdate({ target: schema.courseState.userId, set });
	return json(await load(locals.user.id));
};
