import { accountLevel, competitiveBest, leaderboard } from '#lib/server/progress.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const by = url.searchParams.get('by') === 'level' ? 'xp' : 'speed';
	const [entries, best, level] = await Promise.all([
		leaderboard(by, 100),
		locals.user ? competitiveBest(locals.user.id) : null,
		locals.user ? accountLevel(locals.user.id) : null
	]);
	return { by, entries, me: locals.user ? { best, level } : null };
};
