import { eq } from 'drizzle-orm';
import { SITE_URL } from '#lib/server/config.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import { db, schema } from '#lib/server/db/index.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('app:user');
	if (!locals.user) return { user: null, siteUrl: SITE_URL };
	const rows = await (await db())
		.select({
			username: schema.profiles.username,
			displayName: schema.profiles.displayName,
			avatarColor: schema.profiles.avatarColor
		})
		.from(schema.profiles)
		.where(eq(schema.profiles.userId, locals.user.id))
		.limit(1);
	return {
		user: { email: locals.user.email, profile: rows[0] ?? null, avatar: await avatarUrl(locals.user.id) },
		siteUrl: SITE_URL
	};
};
