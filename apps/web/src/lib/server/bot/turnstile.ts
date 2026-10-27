import { createHash, randomUUID } from 'node:crypto';
import { SITE_URL } from '../config.ts';
import { isPublicSite, isTurnstileTestSecret } from '../config-check.ts';
import { consumeOnce } from './replay.ts';
import type { ProtectedAction } from './ticket.ts';

/*
 * Turnstile, when TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set. Every token verified with
 * Siteverify: valid, this site and action, recent, unused.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Turnstile tokens are valid for five minutes. */
export const TURNSTILE_TOKEN_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 5000;

export function turnstileConfig() {
	const siteKey = process.env.TURNSTILE_SITE_KEY?.trim() || null;
	const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() || null;
	if (!siteKey || !secretKey) return null;
	// Test secrets pass every token; on a public site use the built-in check instead (start-up check logs it).
	if (isTurnstileTestSecret(secretKey) && isPublicSite()) return null;
	return { siteKey, secretKey };
}


export type TurnstileOutcome = 'ok' | 'invalid' | 'replayed' | 'unavailable';

interface SiteverifyResponse {
	success?: boolean;
	'error-codes'?: string[];
	challenge_ts?: string;
	hostname?: string;
	action?: string;
}

/** When Siteverify last failed to answer, so that the self-hosted fallback can be accepted meanwhile. */
let lastOutage = 0;
export const turnstileRecentlyDown = (now = Date.now()) => now - lastOutage < 10 * 60 * 1000;

export async function verifyTurnstile(
	token: unknown,
	opts: { action: ProtectedAction; ip: string; secretKey: string; fetch?: typeof fetch; now?: number }
): Promise<TurnstileOutcome> {
	const now = opts.now ?? Date.now();
	if (typeof token !== 'string' || !token || token.length > 2048) return 'invalid';
	// Local used-token record on top of Cloudflare's, for retries.
	if (!(await consumeOnce('turnstile', createHash('sha256').update(token).digest('base64url'), now + TURNSTILE_TOKEN_MS))) return 'replayed';

	const doFetch = opts.fetch ?? fetch;
	// Same idempotency key so a retried network failure doesn't spend the token.
	const idempotencyKey = randomUUID();
	let data: SiteverifyResponse | null = null;
	for (let attempt = 0; attempt < 2 && !data; attempt++) {
		try {
			const res = await doFetch(SITEVERIFY, {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ secret: opts.secretKey, response: token, remoteip: opts.ip, idempotency_key: idempotencyKey }),
				signal: AbortSignal.timeout(TIMEOUT_MS)
			});
			if (res.ok) data = (await res.json()) as SiteverifyResponse;
		} catch {
			// Network failure or timeout: try once more, then report the service as unavailable.
		}
	}
	if (!data) {
		lastOutage = now;
		return 'unavailable';
	}
	if (!data.success) {
		const codes = data['error-codes'] ?? [];
		if (codes.includes('internal-error')) {
			lastOutage = now;
			return 'unavailable';
		}
		return codes.includes('timeout-or-duplicate') ? 'replayed' : 'invalid';
	}
	// Test secrets match any hostname and action; skip those checks for them. Never returned on a public site.
	if (!isTurnstileTestSecret(opts.secretKey)) {
		const expectedHost = new URL(SITE_URL).hostname;
		if (data.hostname !== expectedHost) return 'invalid';
		if (data.action !== opts.action) return 'invalid';
	}
	const issued = data.challenge_ts ? Date.parse(data.challenge_ts) : NaN;
	if (Number.isFinite(issued) && now - issued > TURNSTILE_TOKEN_MS) return 'replayed';
	return 'ok';
}
