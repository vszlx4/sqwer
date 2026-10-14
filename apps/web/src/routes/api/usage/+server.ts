import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { mergeUsage, type Usage } from '#lib/usage/types.ts';
import type { RequestHandler } from './$types';

const count = z.number().min(0).max(1e12);
const exam = z.object({ started: count, completed: count, abandoned: count, ms: count });
const usageSchema = z.object({
	version: z.literal(1),
	firstSeen: count,
	lastSeen: count,
	activeMs: count,
	visits: count,
	sections: z.record(z.string().max(30), count),
	days: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), count),
	hours: z.array(count).length(24),
	tests: exam.extend({ byExam: z.record(z.string().max(30), exam) }),
	typing: z.object({ keystrokes: count, incorrect: count, backspaces: count, words: count, correctWords: count }),
	words: z.record(z.string().max(40), z.object({ n: count, ok: count, sumWpm: count, bestWpm: count })),
	mapping: z.object({ entries: count })
});

/** Usage for the account, combined across devices. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to view your statistics.');
	const rows = await (await db()).select({ data: schema.usageStats.data }).from(schema.usageStats).where(eq(schema.usageStats.userId, locals.user.id));
	return json({ usage: mergeUsage(rows.map((r) => r.data as Usage)), devices: rows.length });
};

/** Stores this device's usage document. */
export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Sign in to save your statistics.');
	if (!rateLimit(`usage:${locals.user.id}`, 120, 60 * 60 * 1000).ok) error(429, 'Too many requests.');
	if (Number(request.headers.get('content-length') ?? 0) > 1_048_576) error(413, 'The statistics are too large.');
	const body = (await request.json().catch(() => null)) as { deviceId?: unknown; usage?: unknown } | null;
	const deviceId = z.uuid().safeParse(body?.deviceId);
	const parsed = usageSchema.safeParse(body?.usage);
	if (!deviceId.success || !parsed.success) error(400, 'The statistics are not valid.');
	const now = new Date();
	await (await db())
		.insert(schema.usageStats)
		.values({ userId: locals.user.id, deviceId: deviceId.data, data: parsed.data, updatedAt: now })
		.onConflictDoUpdate({ target: [schema.usageStats.userId, schema.usageStats.deviceId], set: { data: parsed.data, updatedAt: now } });
	return json({ ok: true });
};

/** Deletes all usage statistics stored for the account. */
export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to manage your statistics.');
	await (await db()).delete(schema.usageStats).where(eq(schema.usageStats.userId, locals.user.id));
	return json({ ok: true });
};
