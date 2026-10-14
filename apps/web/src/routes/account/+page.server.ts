import { fingerMapCount, requireUser } from '#lib/server/account.ts';
import { activeSessions, remainingRecoveryCodes } from '#lib/server/auth.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const [fingerMap, codes, sessions] = await Promise.all([
		fingerMapCount(user.id),
		remainingRecoveryCodes(user.id),
		activeSessions(user.id)
	]);
	return {
		fingerMap: { count: fingerMap.count, updatedAt: fingerMap.updatedAt?.toISOString() ?? null },
		recoveryCodes: codes,
		sessionCount: sessions.length,
		welcome: url.searchParams.get('welcome') === '1',
		saved: url.searchParams.get('saved') === '1'
	};
};
