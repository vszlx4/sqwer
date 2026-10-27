import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

/** Avatar for its owner, or anyone when the profile is public or on leaderboards. */
export const GET: RequestHandler = async ({ params, locals }) => {
	const d = await db();
	const [row] = await d
		.select({
			mime: schema.avatars.mime,
			data: schema.avatars.data,
			isPublic: schema.profiles.isPublic,
			listed: schema.profiles.showOnLeaderboard,
			suspended: schema.users.suspendedAt
		})
		.from(schema.avatars)
		.innerJoin(schema.users, eq(schema.users.id, schema.avatars.userId))
		.leftJoin(schema.profiles, eq(schema.profiles.userId, schema.avatars.userId))
		.where(eq(schema.avatars.userId, params.id))
		.limit(1);
	const owner = locals.user?.id === params.id;
	const visible = !row?.suspended && (!!row?.isPublic || !!row?.listed);
	if (!row || (!owner && !visible)) error(404, 'Not found.');
	return new Response(Buffer.from(row.data, 'base64'), {
		headers: {
			'Content-Type': row.mime,
			'Cache-Control': owner && !visible ? 'private, max-age=86400' : 'public, max-age=86400',
			'Content-Security-Policy': "default-src 'none'; sandbox",
			'Content-Disposition': 'inline'
		}
	});
};
