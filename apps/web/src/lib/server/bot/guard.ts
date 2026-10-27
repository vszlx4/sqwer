import type { RequestEvent } from '@sveltejs/kit';
import { verifyCaptcha } from '../captcha.ts';
import { rateLimit } from '../rate-limit.ts';
import { logSecurity } from '../security-log.ts';
import { behaviourRisk, CHALLENGE_AT, combine, historyRisk, parseSignals, recordAbuse, requestRisk, ticketRisk, underAttack, type Risk } from './risk.ts';
import { checkTicket, issueTicket, type ProtectedAction } from './ticket.ts';
import { turnstileConfig, turnstileRecentlyDown, verifyTurnstile } from './turnstile.ts';

/*
 * Bot protection for sign-in, sign-up and password reset, server-side:
 * 1. Honeypot field.
 * 2. Signed single-use form ticket (minimum fill time on sign-up).
 * 3. Risk score from headers, form signals and recent failures.
 * 4. Verification: Turnstile when configured, else (or when unreachable) the built-in challenge. Always on
 *    sign-up and reset; on sign-in by risk.
 * 5. Rate limits per address, network and account.
 * Direct requests get the same checks and lack the ticket and signals.
 */

/** Sign-up faster than this after page load is refused; other forms only add risk. */
const SIGNUP_MIN_FILL_MS = 2500;
const FAST_MS = 1500;

export interface HumanCheck {
	action: ProtectedAction;
	provider: 'turnstile' | 'self';
	siteKey: string | null;
	/** Whether to show a challenge straight away. */
	required: boolean;
	ticket: string;
}

/** What a page needs to render the protection for an action. */
export function humanCheck(event: RequestEvent, action: ProtectedAction): HumanCheck {
	const ts = turnstileConfig();
	const ip = event.getClientAddress();
	const risk = combine(requestRisk(event.request.headers), historyRisk(ip, action));
	return {
		action,
		provider: ts ? 'turnstile' : 'self',
		siteKey: ts?.siteKey ?? null,
		required: action !== 'signin' || !!ts || risk.score >= CHALLENGE_AT || underAttack(action),
		ticket: issueTicket(action, event.request.headers.get('user-agent'))
	};
}

export type GuardResult =
	| { ok: true; risk: Risk }
	| {
			ok: false;
			status: number;
			/** Where to show the message: the whole form, or the verification. */
			field: 'form' | 'captcha';
			message: string;
			/** The page should show a challenge (and, with `fallback`, sqwer's own one). */
			challenge: boolean;
			fallback: boolean;
	  };

export const GUARD_MESSAGES = {
	blocked: 'The form could not be submitted. Please reload the page and try again.',
	required: 'Please complete the verification.',
	incorrect: 'The answer did not match. A new challenge has been shown; please try again.',
	expired: 'The verification expired or was already used. Please complete it again.',
	fallback: 'The verification service is not responding. Please complete the check below instead.',
	slow: 'Too many verification attempts from your network. Please wait a few minutes and try again.'
} as const;

/** Runs every layer for a submitted form. The caller applies its own rate limits first. */
export async function guardForm(event: RequestEvent, form: FormData, action: ProtectedAction): Promise<GuardResult> {
	const ip = event.getClientAddress();
	const headers = event.request.headers;
	const ua = headers.get('user-agent');
	const fail = async (status: number, field: 'form' | 'captcha', message: string, why: string, challenge = true, fallback = false): Promise<GuardResult> => {
		recordAbuse(ip, action);
		await logSecurity(field === 'form' ? 'bot_trap' : 'captcha_failed', { ip, detail: `${action}:${why}` });
		return { ok: false, status, field, message, challenge, fallback };
	};

	// 1. The hidden field.
	if (form.get('website')) return fail(400, 'form', GUARD_MESSAGES.blocked, 'honeypot');

	// 2. The ticket.
	const ticket = await checkTicket(form.get('ticket'), action, ua);
	if (action === 'signup' && ticket.state !== 'ok') return fail(400, 'form', GUARD_MESSAGES.blocked, `ticket-${ticket.state}`);
	const fast = ticket.state === 'ok' && ticket.ageMs !== null && ticket.ageMs < (action === 'signup' ? SIGNUP_MIN_FILL_MS : FAST_MS);
	if (fast && action === 'signup') return fail(400, 'form', GUARD_MESSAGES.blocked, 'too-fast');

	// 3. Risk.
	const speed: Risk = fast ? { score: 30, reasons: ['sent-too-fast'] } : { score: 0, reasons: [] };
	const risk = combine(requestRisk(headers), behaviourRisk(parseSignals(form.get('signals'))), ticketRisk(ticket), historyRisk(ip, action), speed);
	const ts = turnstileConfig();
	const needed = action !== 'signin' || !!ts || risk.score >= CHALLENGE_AT || underAttack(action);
	if (!needed) return { ok: true, risk };

	// 4. Person verification.
	const turnstileToken = form.get('cf-turnstile-response');
	const selfHosted = typeof form.get('captchaToken') === 'string' && !!form.get('captchaToken');
	if (ts && typeof turnstileToken === 'string' && turnstileToken) {
		const outcome = await verifyTurnstile(turnstileToken, { action, ip, secretKey: ts.secretKey });
		if (outcome === 'ok') return { ok: true, risk };
		if (outcome === 'unavailable') return fail(503, 'captcha', GUARD_MESSAGES.fallback, 'turnstile-unavailable', true, true);
		return fail(400, 'captcha', outcome === 'replayed' ? GUARD_MESSAGES.expired : GUARD_MESSAGES.required, `turnstile-${outcome}`);
	}
	if (ts && !selfHosted) return fail(400, 'captcha', GUARD_MESSAGES.required, 'no-token');

	// Built-in challenge: sole check without Turnstile, fallback with it. Rate-limited per address, tighter
	// while Turnstile is up.
	const fallbackLimit = ts && !turnstileRecentlyDown() ? 5 : 60;
	if (!rateLimit(`challenge:${ip}`, fallbackLimit, 60 * 60 * 1000).ok) return fail(429, 'captcha', GUARD_MESSAGES.slow, 'fallback-limit', true, !!ts);
	const outcome = await verifyCaptcha(form, action, ua);
	if (outcome === 'ok') return { ok: true, risk };
	return fail(400, 'captcha', outcome === 'incorrect' ? GUARD_MESSAGES.incorrect : GUARD_MESSAGES.required, `challenge-${outcome}`, true, !!ts);
}
