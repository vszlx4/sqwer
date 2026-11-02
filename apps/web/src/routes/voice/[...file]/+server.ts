import { error } from '@sveltejs/kit';
import { voiceFile } from '#lib/server/voice.ts';
import type { RequestHandler } from './$types';

/** Voice model files for Listen and type. Allowlisted paths only. */
export const GET: RequestHandler = async ({ params, request }) => {
	const res = await voiceFile(params.file, request.method === 'HEAD' ? 'HEAD' : 'GET').catch((e: unknown) => {
		console.error(JSON.stringify({ kind: 'voice', error: e instanceof Error ? e.message : String(e) }));
		error(503, 'The voice is not available right now.');
	});
	if (!res) error(404, 'Not found.');
	return res;
};
