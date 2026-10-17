import { createHash, randomUUID } from 'node:crypto';
import { SITE_URL } from '../config.ts';
import { consumeOnce } from './replay.ts';
import type { ProtectedAction } from './ticket.ts';

/*
 * Cloudflare Turnstile, used when TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set.
 * Every token is checked with Cloudflare's Siteverify API on the server before the protected
 * action runs: it must be valid, issued for this site and this action, recent, and not used
 * before. A token is never trusted because the browser says it passed.
 */

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Turnstile tokens are valid for five minutes. */
export const TURNSTILE_TOKEN_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 5000;

export function turnstileConfig() {
	const siteKey = process.env.TURNSTILE_SITE_KEY?.trim() || null;
	const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() || null;
	return siteKey && secretKey ? { siteKey, secretKey } : null;
}

/**
 * Cloudflare's published test secrets (always pass, always fail, already spent) answer for any
 * hostname and action, so those two checks are skipped for them; they are for development only.
 */
const isTestSecret = (secret: string) => /^[123]x0{30,}AA$/.test(secret);

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
	// Our own record of used tokens, in addition to Cloudflare's, so a token is accepted once here
	// even if a check is retried.
	if (!(await consumeOnce('turnstile', createHash('sha256').update(token).digest('base64url'), now + TURNSTILE_TOKEN_MS))) return 'replayed';

	const doFetch = opts.fetch ?? fetch;
	// The same idempotency key lets a retry after a network failure be answered without the token
	// counting as spent.
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
	if (!isTestSecret(opts.secretKey)) {
		const expectedHost = new URL(SITE_URL).hostname;
		if (data.hostname !== expectedHost) return 'invalid';
		if (data.action !== opts.action) return 'invalid';
	}
	const issued = data.challenge_ts ? Date.parse(data.challenge_ts) : NaN;
	if (Number.isFinite(issued) && now - issued > TURNSTILE_TOKEN_MS) return 'replayed';
	return 'ok';
}
