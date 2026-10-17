import type { TicketCheck } from './ticket.ts';
import { countRecent, recordFailure } from '../rate-limit.ts';

/*
 * Risk scoring for protected forms. Each signal adds to a score; at or above CHALLENGE_AT a
 * person-verification is required before the action runs. No single signal blocks anyone, because
 * every one of them can occur in a real browser, and none can identify automation with certainty:
 * a careful script or an AI browser agent can look exactly like a person. Signals only decide when
 * to ask for verification, and how strict the limits are.
 */

export const CHALLENGE_AT = 30;

export interface Risk {
	score: number;
	/** For the security log only; never shown to the visitor. */
	reasons: string[];
}

/** User agents of HTTP libraries, crawlers and automation tools. */
const AUTOMATION_UA = /curl|wget|python|httpx|aiohttp|go-http|java\/|okhttp|node-fetch|axios|undici|libwww|scrapy|phantomjs|selenium|puppeteer|playwright|headlesschrome|electron\/|bot\b|spider|crawler/i;
const BROWSER_UA = /mozilla\/5\.0/i;

/** Signals from the request itself: its headers, compared with what browsers send. */
export function requestRisk(headers: Headers): Risk {
	const r: Risk = { score: 0, reasons: [] };
	const add = (n: number, why: string) => {
		r.score += n;
		r.reasons.push(why);
	};
	const ua = headers.get('user-agent') ?? '';
	if (!ua) add(40, 'no-user-agent');
	else if (AUTOMATION_UA.test(ua)) add(30, 'automation-user-agent');
	else if (!BROWSER_UA.test(ua)) add(20, 'unusual-user-agent');
	if (!headers.get('accept-language')) add(15, 'no-accept-language');
	// Current browsers send Fetch Metadata with every request; HTTP libraries usually do not.
	const site = headers.get('sec-fetch-site');
	if (!site) {
		if (BROWSER_UA.test(ua)) add(15, 'no-fetch-metadata');
	} else if (site === 'cross-site') add(30, 'cross-site-request');
	return r;
}

export interface Signals {
	/** Key presses in the form. */
	k: number;
	/** Pointer presses and moves (counted in buckets). */
	p: number;
	/** Fields focused. */
	f: number;
	/** Pastes. */
	v: number;
	/** Milliseconds between the form appearing and being sent. */
	t: number;
	/** navigator.webdriver, set by browser automation. */
	w: number;
}

/** Parses the interaction summary sent with the form. Missing or malformed summaries count as risk. */
export function parseSignals(raw: unknown): Signals | null {
	if (typeof raw !== 'string' || raw.length > 300) return null;
	try {
		const v = JSON.parse(raw) as Record<string, unknown>;
		const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.min(x, 1e7) : -1);
		const s = { k: n(v.k), p: n(v.p), f: n(v.f), v: n(v.v), t: n(v.t), w: n(v.w) };
		return Object.values(s).some((x) => x < 0) ? null : s;
	} catch {
		return null;
	}
}

/**
 * Signals from how the form was filled. People press keys or paste (password managers paste),
 * move or press a pointer, and take more than a moment. These are weak signals on their own and
 * are scored as such.
 */
export function behaviourRisk(signals: Signals | null): Risk {
	const r: Risk = { score: 0, reasons: [] };
	const add = (n: number, why: string) => {
		r.score += n;
		r.reasons.push(why);
	};
	if (!signals) {
		add(25, 'no-interaction-summary');
		return r;
	}
	if (signals.w) add(30, 'webdriver');
	if (signals.k === 0 && signals.v === 0) add(15, 'no-typing');
	if (signals.p === 0 && signals.f === 0) add(10, 'no-pointer-or-focus');
	if (signals.t < 1200) add(20, 'filled-too-fast');
	return r;
}

/** Signals from the ticket: whether this page was really loaded, and by this browser. */
export function ticketRisk(t: TicketCheck): Risk {
	if (t.state === 'missing') return { score: 40, reasons: ['no-ticket'] };
	if (t.state !== 'ok') return { score: 40, reasons: [`ticket-${t.state}`] };
	const r: Risk = { score: 0, reasons: [] };
	if (!t.sameBrowser) {
		r.score += 20;
		r.reasons.push('ticket-other-browser');
	}
	return r;
}

/* ------------------------------------------------------------- history */

const TEN_MINUTES = 10 * 60 * 1000;

/** The /24 of an IPv4 address or the /48 of an IPv6 address, to group addresses from one network. */
export function networkOf(ip: string): string {
	if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::/48';
	const parts = ip.split('.');
	return parts.length === 4 ? `${parts.slice(0, 3).join('.')}.0/24` : ip;
}

/** Records a failed attempt (wrong password, failed verification) for an address and its network. */
export function recordAbuse(ip: string, action: string) {
	recordFailure(`abuse:${action}:${ip}`);
	recordFailure(`abuse:${action}:${networkOf(ip)}`);
	recordFailure(`abuse:${action}:all`);
}

/** Signals from recent history: earlier failures from this address or its network. */
export function historyRisk(ip: string, action: string): Risk {
	const r: Risk = { score: 0, reasons: [] };
	if (countRecent(`abuse:${action}:${ip}`, TEN_MINUTES) > 0) {
		r.score += 30;
		r.reasons.push('recent-failures-address');
	}
	if (countRecent(`abuse:${action}:${networkOf(ip)}`, TEN_MINUTES) >= 5) {
		r.score += 20;
		r.reasons.push('recent-failures-network');
	}
	return r;
}

/**
 * Many failures across all addresses at once suggest a distributed attack, such as credential
 * stuffing from many addresses. While it lasts, everyone is asked to verify.
 */
export function underAttack(action: string): boolean {
	return countRecent(`abuse:${action}:all`, TEN_MINUTES) >= 60;
}

export function combine(...risks: Risk[]): Risk {
	return { score: risks.reduce((n, r) => n + r.score, 0), reasons: risks.flatMap((r) => r.reasons) };
}
