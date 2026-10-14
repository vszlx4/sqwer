import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { cleanObservations } from '@sqwer/fingermap';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

const MAX_BYTES = 6 * 1024 * 1024;

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to sync your finger map.');
	const rows = await (await db())
		.select()
		.from(schema.fingerMaps)
		.where(eq(schema.fingerMaps.userId, locals.user.id))
		.limit(1);
	return json({ observations: rows[0]?.observations ?? [], updatedAt: rows[0]?.updatedAt ?? null });
};

/** Replaces the stored finger map with the client's merged copy. */
export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) error(401, 'Sign in to sync your finger map.');
	if (!rateLimit(`fingermap:${locals.user.id}`, 120, 60 * 1000).ok) error(429, 'Too many requests.');
	const length = Number(request.headers.get('content-length') ?? 0);
	if (length > MAX_BYTES) error(413, 'The finger map is too large.');
	const body = (await request.json().catch(() => null)) as { observations?: unknown } | null;
	const observations = cleanObservations(body?.observations);
	if (!observations) error(400, 'The finger map contains invalid entries.');
	const now = new Date();
	await (await db())
		.insert(schema.fingerMaps)
		.values({ userId: locals.user.id, observations, updatedAt: now })
		.onConflictDoUpdate({ target: schema.fingerMaps.userId, set: { observations, updatedAt: now } });
	return json({ ok: true, count: observations.length, updatedAt: now });
};
