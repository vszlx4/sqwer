import { error } from '@sveltejs/kit';
import { altcha } from '#lib/server/captcha.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ getClientAddress }) => {
	if (!rateLimit(`captcha:${getClientAddress()}`, 60, 10 * 60 * 1000).ok) error(429, 'Too many requests.');
	return altcha.challengeHandler();
};
