import { error, json } from '@sveltejs/kit';
import { networkOf } from '#lib/server/bot/risk.ts';
import type { ProtectedAction } from '#lib/server/bot/ticket.ts';
import { createChallenge, createProofOfWork } from '#lib/server/captcha.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

const ACTIONS: ProtectedAction[] = ['signin', 'signup', 'reset'];

/**
 * A fresh verification for one form: a proof-of-work challenge and a challenge for the person to
 * answer, bound to that form's action and to the requesting browser.
 */
export const GET: RequestHandler = async ({ getClientAddress, url, setHeaders, request }) => {
	const ip = getClientAddress();
	if (!rateLimit(`captcha:${ip}`, 60, 10 * 60 * 1000).ok || !rateLimit(`captcha:${networkOf(ip)}`, 300, 10 * 60 * 1000).ok) {
		error(429, 'Too many requests.');
	}
	const action = url.searchParams.get('action') as ProtectedAction;
	if (!ACTIONS.includes(action)) error(400, 'Unknown form.');
	setHeaders({ 'cache-control': 'no-store' });
	const kind = url.searchParams.get('kind') === 'text' ? 'text' : 'image';
	return json({ pow: await createProofOfWork(), challenge: createChallenge(kind, action, request.headers.get('user-agent')) });
};
