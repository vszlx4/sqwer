import { redirect } from '@sveltejs/kit';
import { getProfile, requireUser } from '#lib/server/account.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const profile = await getProfile(user.id);
	if (!profile && url.pathname !== '/account/setup') redirect(303, '/account/setup');
	return { account: { email: user.email, createdAt: user.createdAt.toISOString() }, profile, avatar: await avatarUrl(user.id) };
};
