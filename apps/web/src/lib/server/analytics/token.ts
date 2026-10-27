import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { uaHash } from '../bot/ticket.ts';
import { secret } from '../config.ts';

/*
 * Analytics tokens: signed per page load (layout data), bound to the user agent, valid one day. Events need
 * a valid token; each token has its own allowance (routes/api/analytics/+server.ts).
 */

export const ANALYTICS_TOKEN_MS = 24 * 60 * 60 * 1000;
const mac = (body: string) => createHmac('sha256', secret('CAPTCHA_HMAC_SECRET')).update(`analytics\u0000${body}`).digest('base64url');

export function issueAnalyticsToken(userAgent: string | null, now = Date.now()): string {
	const body = Buffer.from(JSON.stringify({ t: now, n: randomBytes(9).toString('base64url'), u: uaHash(userAgent) })).toString('base64url');
	return `${body}.${mac(body)}`;
}

/** The token's id when it is genuine, current and from the same browser; otherwise null. */
export function checkAnalyticsToken(token: unknown, userAgent: string | null, now = Date.now()): string | null {
	if (typeof token !== 'string' || token.length > 400) return null;
	const [body, signature] = token.split('.');
	if (!body || !signature) return null;
	const expected = Buffer.from(mac(body));
	const given = Buffer.from(signature);
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
	try {
		const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { t?: unknown; n?: unknown; u?: unknown };
		if (typeof data.t !== 'number' || typeof data.n !== 'string' || data.u !== uaHash(userAgent)) return null;
		if (now - data.t > ANALYTICS_TOKEN_MS || data.t - now > 60_000) return null;
		return data.n;
	} catch {
		return null;
	}
}
