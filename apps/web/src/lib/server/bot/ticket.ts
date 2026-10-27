import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { secret } from '../config.ts';
import { consumeOnce } from './replay.ts';

/*
 * Form tickets: signed at render, bound to action and user-agent hash, expiring, single use. Proves the page
 * was loaded and when; replaces client-set timing.
 */

export type ProtectedAction = 'signin' | 'signup' | 'reset';

const KEY = secret('CAPTCHA_HMAC_SECRET');
export const TICKET_LIFETIME_MS = 2 * 60 * 60 * 1000;

const mac = (data: string) => createHmac('sha256', KEY).update(`ticket\u0000${data}`).digest('base64url');
/** A short hash of the user agent: enough to tell browsers apart, never stored. */
export const uaHash = (ua: string | null) => createHash('sha256').update(ua ?? '').digest('base64url').slice(0, 16);

function equal(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

export function issueTicket(action: ProtectedAction, userAgent: string | null, now = Date.now()): string {
	const body = Buffer.from(JSON.stringify({ a: action, t: now, n: randomBytes(9).toString('base64url'), u: uaHash(userAgent) })).toString('base64url');
	return `${body}.${mac(body)}`;
}

export type TicketState = 'ok' | 'missing' | 'invalid' | 'expired' | 'replayed';

export interface TicketCheck {
	state: TicketState;
	/** Time from issue to submission, when the ticket could be read. */
	ageMs: number | null;
	/** Whether the ticket was issued to the same browser that submitted it. */
	sameBrowser: boolean;
}

/** Checks a ticket and, if it is valid, uses it up. */
export async function checkTicket(token: unknown, action: ProtectedAction, userAgent: string | null, now = Date.now()): Promise<TicketCheck> {
	const none: TicketCheck = { state: 'missing', ageMs: null, sameBrowser: false };
	if (typeof token !== 'string' || !token) return none;
	if (token.length > 400) return { ...none, state: 'invalid' };
	const [body, signature] = token.split('.');
	if (!body || !signature || !equal(signature, mac(body))) return { ...none, state: 'invalid' };
	let data: { a?: string; t?: number; n?: string; u?: string };
	try {
		data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
	} catch {
		return { ...none, state: 'invalid' };
	}
	if (data.a !== action || typeof data.t !== 'number' || typeof data.n !== 'string') return { ...none, state: 'invalid' };
	const ageMs = now - data.t;
	const sameBrowser = data.u === uaHash(userAgent);
	if (ageMs < 0 || ageMs > TICKET_LIFETIME_MS) return { state: 'expired', ageMs, sameBrowser };
	if (!(await consumeOnce('ticket', data.n, data.t + TICKET_LIFETIME_MS))) return { state: 'replayed', ageMs, sameBrowser };
	return { state: 'ok', ageMs, sameBrowser };
}
