import { error, json } from '@sveltejs/kit';
import { competitiveBest, competitiveStanding } from '#lib/server/progress.ts';
import type { RequestHandler } from './$types';

/** The signed-in player's best verified competitive speed and leaderboard place. */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Sign in to see your standing.');
	const [best, standing] = await Promise.all([competitiveBest(locals.user.id), competitiveStanding(locals.user.id)]);
	return json({ best, standing });
};
