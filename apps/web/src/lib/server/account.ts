import { redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from './db/index.ts';
import { invalidateLeaderboards } from './progress.ts';
import type { ProfileInput } from './validation.ts';

export function requireUser(locals: App.Locals, url: URL) {
	if (!locals.user) redirect(303, `/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
	return locals.user;
}

export async function getProfile(userId: string) {
	const rows = await (await db()).select().from(schema.profiles).where(eq(schema.profiles.userId, userId)).limit(1);
	return rows[0] ?? null;
}

export async function usernameTaken(username: string, userId: string) {
	const rows = await (await db())
		.select({ id: schema.profiles.userId })
		.from(schema.profiles)
		.where(and(eq(schema.profiles.username, username), ne(schema.profiles.userId, userId)))
		.limit(1);
	return rows.length > 0;
}

export async function saveProfile(userId: string, input: ProfileInput) {
	const values = { ...input, updatedAt: new Date() };
	await (await db())
		.insert(schema.profiles)
		.values({ userId, ...values })
		.onConflictDoUpdate({ target: schema.profiles.userId, set: values });
	// The name, picture or leaderboard choice may have changed.
	invalidateLeaderboards();
}

export async function fingerMapCount(userId: string) {
	const rows = await (await db())
		.select({ observations: schema.fingerMaps.observations, updatedAt: schema.fingerMaps.updatedAt })
		.from(schema.fingerMaps)
		.where(eq(schema.fingerMaps.userId, userId))
		.limit(1);
	return { count: rows[0]?.observations.length ?? 0, updatedAt: rows[0]?.updatedAt ?? null };
}
