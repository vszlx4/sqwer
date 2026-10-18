import { error, json } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { FINGERS } from '@sqwer/layouts';
import { categoryOfExam } from '#lib/data/categories.ts';
import { clearedAt } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit, spendBudget } from '#lib/server/rate-limit.ts';
import { checkResult } from '#lib/server/anticheat.ts';
import { logSecurity } from '#lib/server/security-log.ts';
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
	const parsed = recordSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'The result is not valid.');
	const r = parsed.data;
	// A result from before its category was cleared is a stale copy from a browser: it is not kept.
	if (r.at <= (await clearedAt(locals.user.id, categoryOfExam(r.exam)))) error(409, 'This result belongs to data you cleared.');
	const userId = locals.user.id;
	const d = await db();
	// The same result sent again (browsers re-send while syncing) keeps what it was given the first time.
	const [stored] = await d
		.select({ xp: schema.results.xp, verified: schema.results.verified })
		.from(schema.results)
		.where(and(eq(schema.results.id, r.id), eq(schema.results.userId, userId)))
		.limit(1);
	if (stored) return json({ ok: true, xp: stored.xp, verified: stored.verified });

	// The keystrokes are replayed on the server; XP and ranks come from what they produce, never
	// from the browser's own figures (lib/server/anticheat.ts).
	const verdict = checkResult(r);
	if (verdict.kind === 'reject') {
		await logSecurity('result_rejected', { userId, detail: `${r.exam}:${verdict.reason}` });
		error(400, 'The result could not be accepted.');
	}
	let trusted = verdict.kind === 'trusted';
	let reason: string | null = verdict.kind === 'untrusted' ? verdict.reason : null;
	const stats = verdict.stats;
	const hour = 60 * 60 * 1000;
	if (trusted && stats && r.status === 'completed') {
		// Typing time cannot be counted twice: a result overlapping another that earned XP earns none.
		const end = new Date(r.at - 2000);
		const start = new Date(r.at - stats.activeSeconds * 1000 + 2000);
		const [overlap] = await d
			.select({ id: schema.results.id })
			.from(schema.results)
			.where(
				and(
					eq(schema.results.userId, userId),
					gt(schema.results.xp, 0),
					gt(schema.results.createdAt, start),
					sql`${schema.results.createdAt} - make_interval(secs => (${schema.results.data}->>'seconds')::float) < ${end}`
				)
			)
			.limit(1);
		if (overlap) [trusted, reason] = [false, 'overlaps-another-result'];
		// And no more than an hour of typing earns XP per hour, however many results arrive.
		else if (!spendBudget(`typing-time:${userId}`, stats.activeSeconds, 3900, hour)) [trusted, reason] = [false, 'typing-time-budget'];
	}
	const xp = trusted && stats ? examXp({ status: r.status, wpm: stats.wpm, accuracy: stats.accuracy, seconds: stats.activeSeconds }) : 0;
	// Competitive and placement results are checked, because they earn a rank or course credit.
	const check = trusted && stats && r.detail ? { seconds: r.seconds, wpm: stats.wpm, accuracy: stats.accuracy, chars: r.detail.chars, words: r.detail.words, replay: r.detail.replay } : null;
	const verified =
		r.status === 'completed' &&
		!!check &&
		(r.exam === 'competitive' ? verifyCompetitive(check) : r.exam === 'placement' ? verifyMinute(check, 0) : false);
	await (await db())
		.insert(schema.results)
		.values({ id: r.id, userId, exam: r.exam, createdAt: new Date(r.at), data: r, xp, wpm: stats?.wpm ?? r.wpm, verified })
		.onConflictDoNothing();
	if (r.status === 'completed') track('test_completed', { userId, props: { exam: r.exam } });
	if (verified && r.exam === 'competitive') {
		track('ranked_verified', { userId });
		invalidateLeaderboards();
	} else if (xp > 0) {
		// The level leaderboard orders by experience.
		invalidateLeaderboards();
	}
	return json({ ok: true, xp, verified, ...(reason ? { unrated: reason } : {}) });
};
