import { redirect } from '@sveltejs/kit';
import { getProfile, requireUser } from '#lib/server/account.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// History reads results kept in the browser, so it stays open without an account.
	if (!locals.user && (url.pathname === '/account/history' || url.pathname.startsWith('/account/history/'))) {
		return { account: null, profile: null, avatar: null };
	}
	const user = requireUser(locals, url);
	const profile = await getProfile(user.id);
	// Administration has its own gate (404 for members, then 2FA), which a missing profile must not get ahead of.
	const admin = url.pathname === '/account/admin' || url.pathname.startsWith('/account/admin/');
	if (!profile && !admin && url.pathname !== '/account/setup') redirect(303, '/account/setup');
	return { account: { email: user.email, createdAt: user.createdAt.toISOString() }, profile, avatar: await avatarUrl(user.id) };
};
