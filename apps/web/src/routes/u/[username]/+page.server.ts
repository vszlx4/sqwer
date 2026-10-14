import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { buildProfile } from '@sqwer/fingermap';
import { qwertyAnsi, type Platform } from '@sqwer/layouts';
import { avatarUrl } from '#lib/server/avatar.ts';
import { db, schema } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const d = await db();
	const [row] = await d
		.select({ profile: schema.profiles, createdAt: schema.users.createdAt })
		.from(schema.profiles)
		.innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
		.where(and(eq(schema.profiles.username, params.username.toLowerCase()), eq(schema.profiles.isPublic, true)))
		.limit(1);
	if (!row) error(404, 'This profile does not exist or is private.');

	const [fm] = await d.select().from(schema.fingerMaps).where(eq(schema.fingerMaps.userId, row.profile.userId));
	const summary = fm?.observations.length
		? buildProfile(fm.observations, qwertyAnsi(row.profile.platform as Platform))
		: null;

	const p = row.profile;
	return {
		publicProfile: {
			displayName: p.displayName,
			username: p.username,
			bio: p.bio,
			avatarColor: p.avatarColor,
			experience: p.experience,
			goal: p.goal,
			targetWpm: p.targetWpm,
			platform: p.platform,
			memberSince: row.createdAt.toISOString(),
			avatar: await avatarUrl(p.userId)
		},
		fingerMap: summary
			? {
					coverage: Math.round((summary.core.mapped / summary.core.total) * 100),
					keysOwnWay: Object.values(summary.keys).filter((k) => k.mapped && k.differs && !k.code.startsWith('Shift')).length,
					habits: summary.rules.length
				}
			: null
	};
};
