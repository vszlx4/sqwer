import { accountLevel, competitiveBest, competitiveBests, competitiveStanding, leaderboard } from '#lib/server/progress.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const by = url.searchParams.get('by') === 'level' ? 'xp' : 'speed';
	const [entries, bests, best, level, standing] = await Promise.all([
		leaderboard(by, 100),
		competitiveBests(),
		locals.user ? competitiveBest(locals.user.id) : null,
		locals.user ? accountLevel(locals.user.id) : null,
		locals.user ? competitiveStanding(locals.user.id) : null
	]);
	return { by, entries, bests, me: locals.user ? { best, level, standing } : null };
};
