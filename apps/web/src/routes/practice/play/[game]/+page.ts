import { error } from '@sveltejs/kit';
import { gameById } from '#lib/games/endless.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const game = gameById(params.game);
	if (!game) error(404, 'This game does not exist.');
	return { game };
};
