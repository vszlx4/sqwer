import { error, json } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { FINGERS } from '@sqwer/layouts';
import { categoryOfExam } from '#lib/data/categories.ts';
import { clearedAt } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { invalidateLeaderboards } from '#lib/server/progress.ts';
import { verifyCompetitive, verifyMinute } from '#lib/progress/competitive.ts';
import { examXp } from '#lib/progress/xp.ts';
import { EXAM_IDS } from '#lib/results/types.ts';
import type { RequestHandler } from './$types';

const score = z.object({
	wpm: z.number().min(0).max(400),
	accuracy: z.number().min(0).max(100),
	keystrokes: z.number().int().min(0).max(100_000)
});

const detailSchema = z.object({
	timeline: z
		.array(z.object({ s: z.number(), wpm: z.number(), raw: z.number(), acc: z.number(), burst: z.number(), err: z.number().int() }))
		.max(4000),
	words: z.array(z.object({ w: z.string().max(40), t: z.string().max(60), ms: z.number(), wpm: z.number(), ok: z.boolean() })).max(3000),
	targets: z.array(z.string().max(40)).max(3000),
	replay: z.array(z.tuple([z.number(), z.string().max(2)])).max(30000),
	chars: z.object({ correct: z.number().int(), incorrect: z.number().int(), extra: z.number().int(), missed: z.number().int() }),
	keystrokes: z.object({ total: z.number().int(), incorrect: z.number().int(), backspaces: z.number().int() }),
	missedKeys: z.record(z.string().max(2), z.number().int())
});

const recordSchema = z.object({
	id: z.uuid(),
	exam: z.enum(EXAM_IDS),
	at: z.number().int().positive(),
	wpm: z.number().min(0).max(400),
	accuracy: z.number().min(0).max(100),
	raw: z.number().min(0).max(500).optional(),
	consistency: z.number().min(0).max(100).optional(),
	seconds: z.number().min(0).max(3600),
	label: z.string().max(120),
	status: z.enum(['completed', 'abandoned']).default('completed'),
	fingers: z.partialRecord(z.enum(FINGERS), score).optional(),
	detail: detailSchema.optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to sync your results.');
	const rows = await (await db())
		.select({ data: schema.results.data })
		.from(schema.results)
		.where(eq(schema.results.userId, locals.user.id))
		.orderBy(desc(schema.results.createdAt))
		.limit(500);
	return json({ results: rows.map((r) => r.data).reverse() });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Sign in to save your results.');
	if (!rateLimit(`results:${locals.user.id}`, 120, 60 * 60 * 1000).ok) error(429, 'Too many requests.');
	if (Number(request.headers.get('content-length') ?? 0) > 1_048_576) error(413, 'The result is too large.');
	const parsed = recordSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'The result is not valid.');
	const r = parsed.data;
	// A result from before its category was cleared is a stale copy from a browser: it is not kept.
	if (r.at <= (await clearedAt(locals.user.id, categoryOfExam(r.exam)))) error(409, 'This result belongs to data you cleared.');
	// XP and the competitive check are worked out here, never taken from the browser.
	const xp = examXp(r);
	// Competitive and placement results are checked, because they earn a rank or course credit.
	const check = r.detail ? { seconds: r.seconds, wpm: r.wpm, accuracy: r.accuracy, chars: r.detail.chars, words: r.detail.words, replay: r.detail.replay } : null;
	const verified =
		r.status === 'completed' &&
		!!check &&
		(r.exam === 'competitive' ? verifyCompetitive(check) : r.exam === 'placement' ? verifyMinute(check, 0) : false);
	await (await db())
		.insert(schema.results)
		.values({ id: r.id, userId: locals.user.id, exam: r.exam, createdAt: new Date(r.at), data: r, xp, wpm: r.wpm, verified })
		.onConflictDoNothing();
	if (r.status === 'completed') track('test_completed', { userId: locals.user.id, props: { exam: r.exam } });
	if (verified && r.exam === 'competitive') {
		track('ranked_verified', { userId: locals.user.id });
		invalidateLeaderboards();
	} else if (xp > 0) {
		// The level leaderboard orders by experience.
		invalidateLeaderboards();
	}
	return json({ ok: true, xp, verified });
};
