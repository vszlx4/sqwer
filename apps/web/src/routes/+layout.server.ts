import { eq } from 'drizzle-orm';
import { SITE_URL } from '#lib/server/config.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import { dataResets } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { accountLevel, competitiveBest, paceSummary } from '#lib/server/progress.ts';
import { analyticsEnabled } from '#lib/server/analytics/config.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('app:user');
	const analytics = analyticsEnabled();
	if (!locals.user) return { user: null, siteUrl: SITE_URL, analytics };
	const userId = locals.user.id;
	const [rows, level, best, pace, avatar, resets] = await Promise.all([
		(await db())
			.select({
				username: schema.profiles.username,
				displayName: schema.profiles.displayName,
				avatarColor: schema.profiles.avatarColor
			})
			.from(schema.profiles)
			.where(eq(schema.profiles.userId, userId))
			.limit(1),
		accountLevel(userId),
		competitiveBest(userId),
		paceSummary(userId),
		avatarUrl(userId),
		dataResets(userId)
	]);
	return {
		user: { email: locals.user.email, profile: rows[0] ?? null, avatar, level, best, pace, resets, isAdmin: locals.user.role === 'admin' },
		siteUrl: SITE_URL,
		analytics
	};
};
