import { randomUUID } from 'node:crypto';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { channelOf } from '#lib/analytics/shared.ts';
import { db, schema } from '../db/index.ts';
import { requireAdmin, requireAdminApi } from '../admin.ts';
import { sql } from 'drizzle-orm';
import { csvCell } from './csv.ts';
import { batchSchema, ingest, referrerHost, type IncomingEvent } from './ingest.ts';
import { purgeExpired, rollUp } from './maintenance.ts';
import { readCursor, readEventFilters, readFilters, readPeriod } from './params.ts';
import { breakdowns, change, clearAnalyticsCache, coverage, listEvents, previousOf, series, summary, type Range } from './query.ts';
import { flushTracking, track } from './track.ts';
import { isBot, parseClient } from './ua.ts';

const DAY = 24 * 60 * 60 * 1000;
const today = Math.floor(Date.now() / DAY) * DAY;
const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const FIREFOX_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0';

async function reset() {
	const d = await db();
	await d.execute(sql`delete from analytics_events`);
	await d.execute(sql`delete from analytics_daily`);
	clearAnalyticsCache();
}

async function user(role = 'user') {
	const id = randomUUID();
	await (await db()).insert(schema.users).values({ id, email: `${id}@example.com`, passwordHash: 'x', role });
	return id;
}

const pageview = (over: Partial<IncomingEvent> = {}): IncomingEvent => ({
	id: randomUUID(),
	type: 'pageview',
	at: Date.now() - 1000,
	path: '/test',
	route: '/test',
	visitor: randomUUID(),
	session: randomUUID(),
	...over
});

/** Inserts raw events directly, for aggregation tests at chosen times. */
async function seed(rows: Partial<typeof schema.analyticsEvents.$inferInsert>[]) {
	await (await db()).insert(schema.analyticsEvents).values(
		rows.map((r) => ({ id: randomUUID(), occurredAt: new Date(), source: 'client', name: 'pageview', ...r }))
	);
}

describe('user agent parsing', () => {
	it('reads device, browser and system', () => {
		expect(parseClient(CHROME_MAC)).toEqual({ device: 'desktop', browser: 'Chrome', os: 'macOS' });
		expect(parseClient(SAFARI_IPHONE)).toEqual({ device: 'mobile', browser: 'Safari', os: 'iOS' });
		expect(parseClient(FIREFOX_WIN)).toEqual({ device: 'desktop', browser: 'Firefox', os: 'Windows' });
		expect(parseClient('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/141.0 Safari/537.36').device).toBe('tablet');
		expect(parseClient('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/141.0 Safari/537.36 Edg/141.0').browser).toBe('Edge');
	});

	it('recognises automated clients and missing user agents', () => {
		expect(isBot(null)).toBe(true);
		expect(isBot('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
		expect(isBot('curl/8.7.1')).toBe(true);
		expect(isBot('Mozilla/5.0 HeadlessChrome/141.0')).toBe(true);
		expect(isBot(CHROME_MAC)).toBe(false);
	});
});

describe('traffic sources', () => {
	it('classifies channels', () => {
		expect(channelOf(null, {})).toBe('direct');
		expect(channelOf('google.com', {})).toBe('search');
		expect(channelOf('duckduckgo.com', {})).toBe('search');
		expect(channelOf('reddit.com', {})).toBe('social');
		expect(channelOf('t.co', {})).toBe('social');
		expect(channelOf('blog.example.org', {})).toBe('referral');
		expect(channelOf('google.com', { source: 'newsletter' })).toBe('campaign');
	});

	it('keeps only the host of other sites', () => {
		expect(referrerHost('https://www.Google.com/search?q=private')).toBe('google.com');
		expect(referrerHost('https://sqwer.example/learn')).toBeNull();
		expect(referrerHost('http://localhost:3000/')).toBeNull();
		expect(referrerHost('not a url')).toBeNull();
		expect(referrerHost(undefined)).toBeNull();
	});
});

describe('validation of browser events', () => {
	it('accepts a well-formed batch', () => {
		expect(batchSchema.safeParse({ events: [pageview(), pageview({ type: 'engagement', duration: 4000 })] }).success).toBe(true);
	});

	it.each([
		['an empty batch', { events: [] }],
		['more than 20 events', { events: Array.from({ length: 21 }, () => pageview()) }],
		['a path with a query string', { events: [pageview({ path: '/search?q=secret' })] }],
		['a path that is not a path', { events: [pageview({ path: 'https://evil.example/' })] }],
		['an unknown event type', { events: [{ ...pageview(), type: 'purchase' }] }],
		['a visitor id that is not a UUID', { events: [pageview({ visitor: 'me@example.com' })] }],
		['an engagement over six hours', { events: [pageview({ type: 'engagement', duration: 7 * 60 * 60 * 1000 })] }],
		['a route with markup', { events: [pageview({ route: '/<script>' })] }]
	])('refuses %s', (_, body) => {
		expect(batchSchema.safeParse(body).success).toBe(false);
	});
});

describe('ingesting browser events', () => {
	beforeEach(reset);

	it('stores each event once, however often it is sent', async () => {
		const e = pageview();
		expect(await ingest([e], { userId: null, userAgent: CHROME_MAC })).toBe(1);
		expect(await ingest([e], { userId: null, userAgent: CHROME_MAC })).toBe(0);
		expect(await ingest([e, pageview()], { userId: null, userAgent: CHROME_MAC })).toBe(1);
	});

	it('drops automated clients and events outside the accepted time window', async () => {
		expect(await ingest([pageview()], { userId: null, userAgent: 'Googlebot/2.1' })).toBe(0);
		const now = Date.now();
		const stored = await ingest(
			[pageview({ at: now - 2 * DAY }), pageview({ at: now + 10 * 60 * 1000 }), pageview({ at: now - 60_000 })],
			{ userId: null, userAgent: CHROME_MAC, now }
		);
		expect(stored).toBe(1);
	});

	it('takes the account from the session and the client from the user agent', async () => {
		const id = await user();
		await ingest([pageview({ referrer: 'https://www.reddit.com/r/typing', utm: {} })], { userId: id, userAgent: SAFARI_IPHONE });
		const [row] = await (await db()).select().from(schema.analyticsEvents);
		expect(row).toMatchObject({ userId: id, authenticated: true, device: 'mobile', browser: 'Safari', os: 'iOS', referrerHost: 'reddit.com', channel: 'social' });
	});
});

describe('server events', () => {
	beforeEach(reset);

	it('records events without a visitor identifier', async () => {
		const id = await user();
		track('signin_succeeded', { userId: id });
		track('signin_failed', { props: { reason: 'credentials' } });
		await flushTracking();
		const rows = await (await db()).select().from(schema.analyticsEvents);
		expect(rows).toHaveLength(2);
		expect(rows.every((r) => r.source === 'server' && r.visitorId === null && r.device === null)).toBe(true);
	});

	it('never throws, even when the write fails', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// An account that does not exist violates the foreign key.
		expect(() => track('signin_succeeded', { userId: 'no-such-user' })).not.toThrow();
		await flushTracking();
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('aggregation', () => {
	beforeEach(reset);
	const range: Range = { from: new Date(today - 6 * DAY), to: new Date(today + DAY) };

	it('counts page views, visitors, visits, single-page visits and time per visit', async () => {
		const [v1, v2] = [randomUUID(), randomUUID()];
		const [s1, s2, s3] = [randomUUID(), randomUUID(), randomUUID()];
		const at = new Date(today - 2 * DAY + 3_600_000);
		await seed([
			{ visitorId: v1, sessionId: s1, occurredAt: at, route: '/', channel: 'search', referrerHost: 'google.com', device: 'desktop', browser: 'Chrome', os: 'macOS' },
			{ visitorId: v1, sessionId: s1, occurredAt: at, route: '/learn', channel: 'direct', device: 'desktop', browser: 'Chrome', os: 'macOS' },
			{ visitorId: v1, sessionId: s2, occurredAt: at, route: '/', channel: 'direct', device: 'desktop', browser: 'Chrome', os: 'macOS' },
			{ visitorId: v2, sessionId: s3, occurredAt: new Date(today + 60_000), route: '/', channel: 'social', referrerHost: 'reddit.com', device: 'mobile', browser: 'Safari', os: 'iOS' },
			{ name: 'engagement', visitorId: v1, sessionId: s1, occurredAt: at, route: '/', durationMs: 30_000 },
			{ name: 'engagement', visitorId: v1, sessionId: s1, occurredAt: at, route: '/learn', durationMs: 60_000 },
			// Outside the range: not counted.
			{ visitorId: v1, sessionId: s1, occurredAt: new Date(today - 30 * DAY), route: '/' }
		]);
		const s = await summary(range);
		expect(s.pageviews).toBe(4);
		expect(s.visitors).toBe(2);
		expect(s.sessions).toBe(3);
		expect(s.bounceRate).toBeCloseTo(2 / 3);
		expect(s.avgEngagementMs).toBe(30_000);

		const days = await series(range);
		expect(days).toHaveLength(7);
		expect(days.find((d) => d.day === new Date(today - 2 * DAY).toISOString().slice(0, 10))).toMatchObject({ pageviews: 3, visitors: 1, sessions: 2 });
		expect(days.at(-1)).toMatchObject({ pageviews: 1, visitors: 1 });
		expect(days.reduce((n, d) => n + d.pageviews, 0)).toBe(4);

		const top = await breakdowns(range);
		expect(top.pages[0]).toEqual({ key: '/', value: 3, extra: 2 });
		expect(top.referrers.map((r) => r.key).sort()).toEqual(['google.com', 'reddit.com']);
		expect(top.devices).toEqual([
			{ key: 'desktop', value: 1 },
			{ key: 'mobile', value: 1 }
		]);

		clearAnalyticsCache();
		const mobile = await summary(range, { device: 'mobile' });
		expect(mobile).toMatchObject({ pageviews: 1, visitors: 1, sessions: 1 });
		clearAnalyticsCache();
		expect((await summary(range, { channel: 'search' })).pageviews).toBe(1);
		clearAnalyticsCache();
		expect((await summary(range, { route: '/learn' })).pageviews).toBe(1);
	});

	it('counts registrations, sign-ins and failures from server events', async () => {
		const id = await user();
		const at = new Date(today - DAY);
		await seed([
			{ source: 'server', name: 'signup_completed', userId: id, occurredAt: at },
			{ source: 'server', name: 'signin_succeeded', userId: id, occurredAt: at },
			{ source: 'server', name: 'signin_failed', occurredAt: at, props: { reason: 'credentials' } },
			{ source: 'server', name: 'signin_failed', occurredAt: at, props: { reason: 'credentials' } },
			{ source: 'server', name: 'signin_failed', occurredAt: at, props: { reason: 'locked' } }
		]);
		const s = await summary(range);
		expect(s).toMatchObject({ registrations: 1, signins: 1, signinFailures: 3, activeUsers: 1, pageviews: 0 });
		const top = await breakdowns(range);
		expect(top.failureReasons).toEqual([
			{ key: 'credentials', value: 2 },
			{ key: 'locked', value: 1 }
		]);
		const cov = await coverage();
		expect(cov.clientSince).toBeNull();
		expect(cov.serverSince).not.toBeNull();
	});

	it('pages through events without gaps or repeats', async () => {
		const at = today - DAY;
		// Several events share a timestamp, which the cursor must still separate.
		await seed(Array.from({ length: 123 }, (_, i) => ({ occurredAt: new Date(at + Math.floor(i / 3) * 1000) })));
		const seen = new Set<string>();
		let cursor: { at: string; id: string } | null = null;
		let pages = 0;
		do {
			const page = await listEvents(range, {}, cursor, 50);
			expect(page.total).toBe(123);
			for (const e of page.events) seen.add(e.id);
			cursor = page.next;
			pages++;
		} while (cursor && pages < 10);
		expect(pages).toBe(3);
		expect(seen.size).toBe(123);
	});
});

describe('period comparison', () => {
	it('gives a percentage only when there is something to compare with', () => {
		expect(change(150, 100, true)).toBe(50);
		expect(change(50, 100, true)).toBe(-50);
		expect(change(10, 0, true)).toBeNull();
		expect(change(10, 5, false)).toBeNull();
		expect(change(null, 5, true)).toBeNull();
	});

	it('compares with the period of the same length just before', () => {
		const r: Range = { from: new Date(today - 7 * DAY), to: new Date(today) };
		expect(previousOf(r)).toEqual({ from: new Date(today - 14 * DAY), to: new Date(today - 7 * DAY) });
	});
});

describe('retention and daily totals', () => {
	beforeEach(reset);

	it('summarises finished days, then removes raw events past retention', async () => {
		const old = today - 400 * DAY;
		const visitor = randomUUID();
		await seed([
			{ occurredAt: new Date(old + 1000), visitorId: visitor, sessionId: randomUUID() },
			{ occurredAt: new Date(old + 2000), visitorId: visitor, sessionId: randomUUID() },
			{ occurredAt: new Date(old + 3000), source: 'server', name: 'signup_completed' },
			{ occurredAt: new Date(today - DAY), visitorId: randomUUID(), sessionId: randomUUID() }
		]);
		const days = await rollUp(Date.now(), 1000);
		const oldDay = new Date(old).toISOString().slice(0, 10);
		expect(days).toContain(oldDay);
		// Yesterday's events may still arrive, so it is not summarised yet.
		expect(days).not.toContain(new Date(today - DAY).toISOString().slice(0, 10));
		expect(await rollUp(Date.now(), 1000)).toEqual([]);

		expect(await purgeExpired()).toBe(3);
		const remaining = await (await db()).select().from(schema.analyticsEvents);
		expect(remaining).toHaveLength(1);

		// A range reaching past retention uses the daily totals, and says what it cannot know.
		clearAnalyticsCache();
		const s = await summary({ from: new Date(old), to: new Date(today + DAY) });
		expect(s.pageviews).toBe(3);
		expect(s.registrations).toBe(1);
		expect(s.visitors).toBeNull();
		expect(s.bounceRate).toBeNull();
	});
});

describe('dashboard parameters', () => {
	const now = Date.parse('2026-10-17T15:00:00Z');

	it('reads presets and falls back to 30 days', () => {
		expect(readPeriod(new URLSearchParams('range=7d'), now)).toMatchObject({ preset: '7d', fromDay: '2026-10-11', toDay: '2026-10-17', days: 7 });
		expect(readPeriod(new URLSearchParams(''), now)).toMatchObject({ preset: '30d', days: 30 });
		expect(readPeriod(new URLSearchParams('range=forever'), now)).toMatchObject({ preset: '30d', days: 30 });
	});

	it('reads custom dates, capped at today and 400 days', () => {
		expect(readPeriod(new URLSearchParams('range=custom&from=2026-09-01&to=2026-09-30'), now)).toMatchObject({ preset: 'custom', fromDay: '2026-09-01', toDay: '2026-09-30', days: 30 });
		expect(readPeriod(new URLSearchParams('range=custom&from=2026-10-01&to=2027-01-01'), now).toDay).toBe('2026-10-17');
		expect(readPeriod(new URLSearchParams('range=custom&from=2020-01-01&to=2026-10-17'), now).days).toBe(400);
		expect(readPeriod(new URLSearchParams('range=custom&from=2026-10-10&to=2026-10-01'), now).preset).toBe('30d');
		expect(readPeriod(new URLSearchParams('range=custom&from=nope&to=2026-10-01'), now).preset).toBe('30d');
	});

	it('ignores filter values that are not allowed', () => {
		expect(readFilters(new URLSearchParams('channel=search&device=fridge&visitors=everyone'))).toEqual({ route: null, channel: 'search', device: null, auth: null });
		expect(readEventFilters(new URLSearchParams('source=admin&event=pageview')).source).toBeNull();
		expect(readCursor(new URLSearchParams('after=2026-10-01T00:00:00.000Z|abc'))).toEqual({ at: '2026-10-01T00:00:00.000Z', id: 'abc' });
		expect(readCursor(new URLSearchParams('after=garbage'))).toBeNull();
	});
});

describe('administrator access', () => {
	const url = new URL('https://sqwer.example/admin/analytics?range=7d');
	const as = (role: string | null, mfa: { enabled?: boolean; verifiedAgoMs?: number } = { enabled: true, verifiedAgoMs: 0 }) =>
		({
			user: role ? { id: 'u', email: 'a@b.c', role, totpEnabledAt: mfa.enabled ? new Date() : null } : null,
			sessionMfaAt: mfa.verifiedAgoMs === undefined ? null : new Date(Date.now() - mfa.verifiedAgoMs)
		}) as unknown as App.Locals;
	const thrown = (fn: () => unknown) => {
		try {
			fn();
		} catch (e) {
			return e;
		}
		return null;
	};

	it('sends visitors to sign in and hides the pages from members', () => {
		const r = thrown(() => requireAdmin(as(null), url));
		expect(isRedirect(r) && r.location).toBe('/signin?redirectTo=%2Fadmin%2Fanalytics%3Frange%3D7d');
		const e = thrown(() => requireAdmin(as('user'), url));
		expect(isHttpError(e) && e.status).toBe(404);
		expect(thrown(() => requireAdmin(as('admin'), url))).toBeNull();
	});

	it('requires an authenticator app, confirmed in this session within 12 hours', () => {
		const setup = thrown(() => requireAdmin(as('admin', { enabled: false }), url));
		expect(isRedirect(setup) && setup.location).toBe('/admin/2fa/setup?next=%2Fadmin%2Fanalytics%3Frange%3D7d');
		const check = thrown(() => requireAdmin(as('admin', { enabled: true }), url));
		expect(isRedirect(check) && check.location).toBe('/admin/2fa?next=%2Fadmin%2Fanalytics%3Frange%3D7d');
		const stale = thrown(() => requireAdmin(as('admin', { enabled: true, verifiedAgoMs: 13 * 60 * 60 * 1000 }), url));
		expect(isRedirect(stale) && stale.location).toContain('/admin/2fa?');
		// The set-up and check pages themselves only need the role.
		expect(thrown(() => requireAdmin(as('admin', { enabled: false }), url, { mfa: false }))).toBeNull();
		const api = thrown(() => requireAdminApi(as('admin', { enabled: true })));
		expect(isHttpError(api) && api.status).toBe(403);
		expect(thrown(() => requireAdminApi(as('admin')))).toBeNull();
	});

	it('answers 401 and 403 from the API', () => {
		const a = thrown(() => requireAdminApi(as(null)));
		expect(isHttpError(a) && a.status).toBe(401);
		const b = thrown(() => requireAdminApi(as('user')));
		expect(isHttpError(b) && b.status).toBe(403);
	});
});

describe('CSV export', () => {
	it('escapes cells and neutralises formulas', () => {
		expect(csvCell('plain')).toBe('plain');
		expect(csvCell('a,b')).toBe('"a,b"');
		expect(csvCell('say "hi"')).toBe('"say ""hi"""');
		expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
		expect(csvCell('+1')).toBe("'+1");
		expect(csvCell(null)).toBe('');
		expect(csvCell(42)).toBe('42');
	});
});

afterEach(() => vi.restoreAllMocks());
