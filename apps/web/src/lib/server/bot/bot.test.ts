import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it } from 'vitest';
import { countRecent, rateLimit, resetRateLimits } from '../rate-limit.ts';
import { guardForm, GUARD_MESSAGES } from './guard.ts';
import { consumeOnce } from './replay.ts';
import { behaviourRisk, CHALLENGE_AT, networkOf, parseSignals, requestRisk } from './risk.ts';
import { checkTicket, issueTicket, TICKET_LIFETIME_MS } from './ticket.ts';
import { turnstileRecentlyDown, verifyTurnstile } from './turnstile.ts';

const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const browserHeaders = (ua = BROWSER) =>
	new Headers({ 'user-agent': ua, 'accept-language': 'en-GB,en;q=0.9', 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'navigate' });
const humanSignals = JSON.stringify({ k: 34, p: 9, f: 3, v: 0, t: 14_000, w: 0 });

afterEach(() => {
	resetRateLimits();
	delete process.env.TURNSTILE_SITE_KEY;
	delete process.env.TURNSTILE_SECRET_KEY;
});

describe('one-time tokens', () => {
	it('accept a token once, even when used twice at the same moment', async () => {
		const id = `t-${Math.random()}`;
		const results = await Promise.all([consumeOnce('test', id, Date.now() + 60_000), consumeOnce('test', id, Date.now() + 60_000)]);
		expect(results.filter(Boolean)).toHaveLength(1);
		expect(await consumeOnce('test', id, Date.now() + 60_000)).toBe(false);
		// The kind is part of the key: the same value in another kind is a different token.
		expect(await consumeOnce('other', id, Date.now() + 60_000)).toBe(true);
	});
});

describe('form tickets', () => {
	it('are valid once, for their action and browser, until they expire', async () => {
		const t = issueTicket('signup', BROWSER);
		expect((await checkTicket(t, 'signup', BROWSER)).state).toBe('ok');
		expect((await checkTicket(t, 'signup', BROWSER)).state).toBe('replayed');
		expect((await checkTicket(issueTicket('signin', BROWSER), 'signup', BROWSER)).state).toBe('invalid');
		expect((await checkTicket(issueTicket('signup', BROWSER), 'signup', 'curl/8.0')).sameBrowser).toBe(false);
		const old = issueTicket('reset', BROWSER, Date.now() - TICKET_LIFETIME_MS - 1000);
		expect((await checkTicket(old, 'reset', BROWSER)).state).toBe('expired');
		expect((await checkTicket(undefined, 'reset', BROWSER)).state).toBe('missing');
	});

	it('cannot be forged or altered', async () => {
		const [body] = issueTicket('signup', BROWSER).split('.');
		const changed = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body!, 'base64url').toString()), t: Date.now() - 60_000 })).toString('base64url');
		expect((await checkTicket(`${changed}.${'A'.repeat(43)}`, 'signup', BROWSER)).state).toBe('invalid');
		expect((await checkTicket(`${body}.x`, 'signup', BROWSER)).state).toBe('invalid');
		expect((await checkTicket('x'.repeat(500), 'signup', BROWSER)).state).toBe('invalid');
	});
});

describe('Turnstile verification', () => {
	const secretKey = 'live-secret-for-tests';
	/** A stand-in for Cloudflare's Siteverify that records what was sent. */
	const fake = (reply: (body: URLSearchParams) => Response | Promise<Response>) => {
		const calls: URLSearchParams[] = [];
		const fn = (async (_url: string, init: RequestInit) => {
			const body = new URLSearchParams(init.body as string);
			calls.push(body);
			return reply(body);
		}) as unknown as typeof fetch;
		return { fn, calls };
	};
	const ok = (extra: Record<string, unknown> = {}) =>
		Response.json({ success: true, hostname: 'sqwer.example', action: 'signup', challenge_ts: new Date().toISOString(), ...extra });
	const token = () => `token-${Math.random()}`;

	it('accepts a valid token for this site and action, and sends the secret and address', async () => {
		const { fn, calls } = fake(() => ok());
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '203.0.113.9', secretKey, fetch: fn })).toBe('ok');
		expect(calls[0]!.get('secret')).toBe(secretKey);
		expect(calls[0]!.get('remoteip')).toBe('203.0.113.9');
		expect(calls[0]!.get('idempotency_key')).toBeTruthy();
	});

	it('refuses a token issued for another action or another site', async () => {
		expect(await verifyTurnstile(token(), { action: 'signin', ip: '1.1.1.1', secretKey, fetch: fake(() => ok()).fn })).toBe('invalid');
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: fake(() => ok({ hostname: 'evil.example' })).fn })).toBe('invalid');
	});

	it('refuses replayed, duplicate and expired tokens', async () => {
		const t = token();
		const { fn, calls } = fake(() => ok());
		expect(await verifyTurnstile(t, { action: 'signup', ip: '1.1.1.1', secretKey, fetch: fn })).toBe('ok');
		// The second use is refused here, without asking Cloudflare again.
		expect(await verifyTurnstile(t, { action: 'signup', ip: '1.1.1.1', secretKey, fetch: fn })).toBe('replayed');
		expect(calls).toHaveLength(1);
		const duplicate = fake(() => Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] }));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: duplicate.fn })).toBe('replayed');
		const stale = fake(() => ok({ challenge_ts: new Date(Date.now() - 10 * 60 * 1000).toISOString() }));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: stale.fn })).toBe('replayed');
	});

	it('refuses invalid responses and missing tokens', async () => {
		const bad = fake(() => Response.json({ success: false, 'error-codes': ['invalid-input-response'] }));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: bad.fn })).toBe('invalid');
		expect(await verifyTurnstile('', { action: 'signup', ip: '1.1.1.1', secretKey, fetch: bad.fn })).toBe('invalid');
		expect(await verifyTurnstile('x'.repeat(3000), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: bad.fn })).toBe('invalid');
	});

	it('retries once after a network failure, then reports the service as unavailable', async () => {
		let n = 0;
		const flaky = fake(() => (n++ === 0 ? Promise.reject(new Error('network')) : ok()));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: flaky.fn })).toBe('ok');
		expect(flaky.calls[0]!.get('idempotency_key')).toBe(flaky.calls[1]!.get('idempotency_key'));
		const down = fake(() => new Response('bad gateway', { status: 502 }));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: down.fn })).toBe('unavailable');
		expect(turnstileRecentlyDown()).toBe(true);
		const internal = fake(() => Response.json({ success: false, 'error-codes': ['internal-error'] }));
		expect(await verifyTurnstile(token(), { action: 'signup', ip: '1.1.1.1', secretKey, fetch: internal.fn })).toBe('unavailable');
	});
});

describe('risk signals', () => {
	it('score HTTP libraries and automation above the challenge threshold, and ordinary browsers at zero', () => {
		expect(requestRisk(browserHeaders()).score).toBe(0);
		for (const ua of ['curl/8.4.0', 'python-requests/2.31', 'Mozilla/5.0 HeadlessChrome/140.0', '']) {
			expect(requestRisk(new Headers({ 'user-agent': ua })).score).toBeGreaterThanOrEqual(CHALLENGE_AT);
		}
		expect(requestRisk(new Headers({ ...Object.fromEntries(browserHeaders()), 'sec-fetch-site': 'cross-site' })).score).toBeGreaterThanOrEqual(CHALLENGE_AT);
	});

	it('read how a form was filled, without trusting a malformed summary', () => {
		expect(behaviourRisk(parseSignals(humanSignals)).score).toBe(0);
		expect(behaviourRisk(parseSignals(JSON.stringify({ k: 0, p: 0, f: 0, v: 0, t: 300, w: 1 }))).score).toBeGreaterThanOrEqual(CHALLENGE_AT);
		expect(parseSignals('{"k":-1}')).toBeNull();
		expect(parseSignals('not json')).toBeNull();
		expect(behaviourRisk(null).score).toBeGreaterThan(0);
	});

	it('group addresses by network', () => {
		expect(networkOf('203.0.113.77')).toBe('203.0.113.0/24');
		expect(networkOf('2001:db8:abcd:12::1')).toBe('2001:db8:abcd::/48');
	});
});

describe('rate limiter', () => {
	it('cannot be reset by flooding it with new keys', () => {
		for (let i = 0; i < 3; i++) rateLimit('victim', 3, 60_000);
		expect(rateLimit('victim', 3, 60_000).ok).toBe(false);
		for (let i = 0; i < 120_000; i++) rateLimit(`flood-${i}`, 1, 60_000);
		// The victim's key was used recently, so it survives the eviction of older keys.
		rateLimit('victim', 3, 60_000);
		expect(countRecent('victim', 60_000)).toBeGreaterThanOrEqual(3);
	});
});

describe('form guard', () => {
	const event = (headers: Headers, ip = '198.51.100.20') => ({ getClientAddress: () => ip, request: { headers } }) as unknown as RequestEvent;
	const formOf = (fields: Record<string, string>) => {
		const f = new FormData();
		for (const [k, v] of Object.entries(fields)) f.set(k, v);
		return f;
	};
	const aged = (action: 'signin' | 'signup' | 'reset', ua = BROWSER) => issueTicket(action, ua, Date.now() - 20_000);

	it('lets an ordinary sign-in through without a challenge', async () => {
		const r = await guardForm(event(browserHeaders()), formOf({ ticket: aged('signin'), signals: humanSignals }), 'signin');
		expect(r.ok).toBe(true);
	});

	it('asks a direct request with no ticket or browser signals to verify', async () => {
		const r = await guardForm(event(new Headers({ 'user-agent': 'python-requests/2.31' })), formOf({ email: 'a@b.c', password: 'x' }), 'signin');
		expect(r.ok).toBe(false);
		if (!r.ok) expect([r.field, r.message, r.challenge]).toEqual(['captcha', GUARD_MESSAGES.required, true]);
	});

	it('asks to verify after a failure from the same address', async () => {
		const ip = '198.51.100.99';
		await guardForm(event(browserHeaders(), ip), formOf({ ticket: aged('signin'), signals: humanSignals, website: 'spam' }), 'signin');
		const r = await guardForm(event(browserHeaders(), ip), formOf({ ticket: aged('signin'), signals: humanSignals }), 'signin');
		expect(r.ok).toBe(false);
	});

	it('blocks sign-up without a valid ticket, too fast, or with the hidden field filled', async () => {
		const base = { signals: humanSignals, captchaToken: 'x', captchaAnswer: 'x', altcha: 'x' };
		for (const fields of [base, { ...base, ticket: 'forged.ticket' }, { ...base, ticket: issueTicket('signup', BROWSER) }, { ...base, ticket: aged('signup'), website: 'http://spam' }]) {
			const r = await guardForm(event(browserHeaders()), formOf(fields), 'signup');
			expect(r.ok).toBe(false);
			if (!r.ok) expect(r.message).toBe(GUARD_MESSAGES.blocked);
		}
	});

	it('requires verification for sign-up even from an ordinary browser', async () => {
		const r = await guardForm(event(browserHeaders()), formOf({ ticket: aged('signup'), signals: humanSignals }), 'signup');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.message).toBe(GUARD_MESSAGES.required);
	});

	it('with Turnstile configured, requires its token for every action', async () => {
		process.env.TURNSTILE_SITE_KEY = 'site';
		process.env.TURNSTILE_SECRET_KEY = 'secret';
		const r = await guardForm(event(browserHeaders()), formOf({ ticket: aged('signin'), signals: humanSignals }), 'signin');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.message).toBe(GUARD_MESSAGES.required);
	});
});

describe('distributed attacks', async () => {
	const { recordAbuse, underAttack } = await import('./risk.ts');
	it('ask everyone to verify while failures spike across many addresses', async () => {
		expect(underAttack('signin')).toBe(false);
		for (let i = 0; i < 60; i++) recordAbuse(`203.0.${Math.floor(i / 250)}.${i % 250}`, 'signin');
		expect(underAttack('signin')).toBe(true);
		const event = { getClientAddress: () => '192.0.2.200', request: { headers: browserHeaders() } } as unknown as RequestEvent;
		const f = new FormData();
		f.set('ticket', issueTicket('signin', BROWSER, Date.now() - 20_000));
		f.set('signals', humanSignals);
		expect((await guardForm(event, f, 'signin')).ok).toBe(false);
	});
});
