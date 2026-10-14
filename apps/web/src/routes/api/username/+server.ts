import { error, json } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { usernameSchema } from '#lib/server/validation.ts';
import type { RequestHandler } from './$types';

/** Checks whether a username is valid and free. Signed-in users only. */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) error(401, 'Sign in to check usernames.');
	if (!rateLimit(`username:${locals.user.id}`, 120, 60 * 1000).ok) error(429, 'Too many requests.');
	const parsed = usernameSchema.safeParse(url.searchParams.get('u') ?? '');
	if (!parsed.success) return json({ available: false, message: parsed.error.issues[0]?.message });
	const taken = await (await db())
		.select({ id: schema.profiles.userId })
		.from(schema.profiles)
		.where(and(eq(schema.profiles.username, parsed.data), ne(schema.profiles.userId, locals.user.id)))
		.limit(1);
	return json(taken.length ? { available: false, message: 'This username is already taken.' } : { available: true });
};
