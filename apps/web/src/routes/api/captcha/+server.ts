import { error, json } from '@sveltejs/kit';
import { createChallenge, createProofOfWork } from '#lib/server/captcha.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

/** A fresh verification: a proof-of-work challenge and a challenge for the person to answer. */
export const GET: RequestHandler = async ({ getClientAddress, url, setHeaders }) => {
	if (!rateLimit(`captcha:${getClientAddress()}`, 60, 10 * 60 * 1000).ok) error(429, 'Too many requests.');
	setHeaders({ 'cache-control': 'no-store' });
	const kind = url.searchParams.get('kind') === 'text' ? 'text' : 'image';
	return json({ pow: await createProofOfWork(), challenge: createChallenge(kind) });
};
