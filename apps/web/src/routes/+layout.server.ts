import { eq } from 'drizzle-orm';
import { SITE_URL } from '#lib/server/config.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import { dataResets } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { accountLevel, competitiveBest, paceSummary } from '#lib/server/progress.ts';
import { analyticsEnabled } from '#lib/server/analytics/config.ts';
import { issueAnalyticsToken } from '#lib/server/analytics/token.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { addressOf } from '#lib/server/security-log.ts';
import type { LayoutServerLoad } from './$types';

/** Analytics token (lib/server/analytics/token.ts), rate-limited per address and network. */
function analyticsToken(event: Parameters<LayoutServerLoad>[0]): string | null {
	const ip = addressOf(event);
	if (!ip || !rateLimit(`analytics-token:${ip}`, 300, 10 * 60 * 1000).ok || !rateLimit(`analytics-token:net:${networkOf(ip)}`, 1_500, 10 * 60 * 1000).ok) return null;
	return issueAnalyticsToken(event.request.headers.get('user-agent'));
}

export const load: LayoutServerLoad = async (event) => {
	const { locals, depends } = event;
	depends('app:user');
	const analytics = analyticsEnabled();
	const analyticsTokenValue = analytics ? analyticsToken(event) : null;
	if (!locals.user) return { user: null, siteUrl: SITE_URL, analytics, analyticsToken: analyticsTokenValue };
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
		analytics,
		analyticsToken: analyticsTokenValue
	};
};
