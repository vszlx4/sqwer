import { sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { retentionDays } from './config.ts';

/*
 * Dashboard aggregations. Range-bounded, index-backed, briefly cached. Expired days come from
 * analytics_daily; measures it can't give (unique visitors across days, bounce, breakdowns) are unavailable,
 * not zero.
 */

export interface Range {
	/** Start of the first day (UTC), inclusive. */
	from: Date;
	/** Start of the day after the last day (UTC), exclusive. */
	to: Date;
}

export interface Filters {
	route?: string | null;
	channel?: string | null;
	device?: string | null;
	auth?: 'signed-in' | 'anonymous' | null;
}

const DAY = 24 * 60 * 60 * 1000;
type Row = Record<string, unknown>;
const rowsOf = (r: unknown) => (r as { rows: Row[] }).rows;
const num = (v: unknown) => (v == null ? 0 : Number(v));
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function run(query: SQL): Promise<Row[]> {
	return rowsOf(await (await db()).execute(query));
}

/* ------------------------------------------------------------------ cache */

const cache = new Map<string, { at: number; value: unknown }>();
const TTL_MS = 60_000;

async function cached<T>(key: string, compute: () => Promise<T>): Promise<T> {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
	const value = await compute();
	cache.set(key, { at: Date.now(), value });
	if (cache.size > 200) cache.delete(cache.keys().next().value!);
	return value;
}

export function clearAnalyticsCache() {
	cache.clear();
}

/* ------------------------------------------------------------- filtering */

/** Raw events are kept from this moment on; earlier days exist only as daily totals. */
export const rawCutoff = (now = Date.now()) => new Date(Math.floor((now - retentionDays() * DAY) / DAY) * DAY);

function clientWhere(range: Range, f: Filters, name = 'pageview'): SQL {
	const parts: SQL[] = [sql`source = 'client'`, sql`name = ${name}`, sql`occurred_at >= ${range.from}`, sql`occurred_at < ${range.to}`];
	if (f.route) parts.push(sql`coalesce(route, path) = ${f.route}`);
	if (f.device) parts.push(sql`device = ${f.device}`);
	if (f.auth === 'signed-in') parts.push(sql`authenticated`);
	if (f.auth === 'anonymous') parts.push(sql`not authenticated`);
	if (f.channel && name === 'pageview') parts.push(sql`channel = ${f.channel}`);
	return sql.join(parts, sql` and `);
}

/* --------------------------------------------------------------- coverage */

export interface Coverage {
	/** First browser event and first server event ever recorded, or null if none. */
	clientSince: string | null;
	serverSince: string | null;
	rawCutoff: string;
}

export function coverage(): Promise<Coverage> {
	return cached('coverage', async () => {
		const [c] = await run(sql`select
			(select min(occurred_at) from analytics_events where source = 'client') as client,
			(select min(occurred_at) from analytics_events where source = 'server') as server,
			(select min(day) from analytics_daily where metric = 'pageviews' and value > 0) as client_daily,
			(select min(day) from analytics_daily where metric = 'signins' and value > 0) as server_daily`);
		const first = (a: unknown, b: unknown) => {
			const dates = [a, b].filter(Boolean).map((d) => new Date(d as string));
			return dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString() : null;
		};
		return { clientSince: first(c?.client, c?.client_daily), serverSince: first(c?.server, c?.server_daily), rawCutoff: rawCutoff().toISOString() };
	});
}

/* ---------------------------------------------------------------- summary */

export interface Summary {
	pageviews: number;
	/** Null when the range reaches back before the raw retention period. */
	visitors: number | null;
	sessions: number;
	bounceRate: number | null;
	/** Average visible time per session, in milliseconds. */
	avgEngagementMs: number | null;
	signedInVisitors: number | null;
	registrations: number;
	signins: number;
	signinFailures: number;
	activeUsers: number | null;
	testsCompleted: number;
	lessonsCompleted: number;
}

const SERVER_TOTALS: Record<string, keyof Summary> = {
	signup_completed: 'registrations',
	signin_succeeded: 'signins',
	signin_failed: 'signinFailures',
	test_completed: 'testsCompleted',
	lesson_completed: 'lessonsCompleted'
};
/** Metric names in analytics_daily for the same totals. */
const DAILY_METRIC: Record<string, string> = {
	signup_completed: 'registrations',
	signin_succeeded: 'signins',
	signin_failed: 'signin_failures',
	test_completed: 'tests',
	lesson_completed: 'lessons'
};

export function summary(range: Range, f: Filters = {}): Promise<Summary> {
	return cached(`summary:${range.from.getTime()}:${range.to.getTime()}:${JSON.stringify(f)}`, async () => {
		const cutoff = rawCutoff();
		const raw: Range = { from: new Date(Math.max(range.from.getTime(), cutoff.getTime())), to: range.to };
		const older = range.from < cutoff;

		const [c] = await run(sql`with pv as (
				select visitor_id, session_id, user_id from analytics_events where ${clientWhere(raw, f)}
			), s as (select session_id, count(*) as n from pv group by session_id)
			select
				(select count(*) from pv) as pageviews,
				(select count(distinct visitor_id) from pv) as visitors,
				(select count(*) from s) as sessions,
				(select count(*) from s where n = 1) as bounces,
				(select count(distinct user_id) from pv where user_id is not null) as signed_in,
				(select coalesce(sum(duration_ms), 0) from analytics_events
					where ${clientWhere(raw, { ...f, channel: null }, 'engagement')} and session_id in (select session_id from s)) as engaged`);

		const server = await run(sql`select name, count(*) as n from analytics_events
			where source = 'server' and occurred_at >= ${raw.from} and occurred_at < ${raw.to} group by name`);
		const [active] = await run(sql`select count(distinct user_id) as n from analytics_events
			where user_id is not null and occurred_at >= ${raw.from} and occurred_at < ${raw.to}`);

		const out: Summary = {
			pageviews: num(c?.pageviews),
			visitors: num(c?.visitors),
			sessions: num(c?.sessions),
			bounceRate: num(c?.sessions) ? num(c?.bounces) / num(c?.sessions) : null,
			avgEngagementMs: num(c?.sessions) ? num(c?.engaged) / num(c?.sessions) : null,
			signedInVisitors: num(c?.signed_in),
			registrations: 0,
			signins: 0,
			signinFailures: 0,
			activeUsers: num(active?.n),
			testsCompleted: 0,
			lessonsCompleted: 0
		};
		for (const r of server) {
			const key = SERVER_TOTALS[r.name as string];
			if (key) (out[key] as number) = num(r.n);
		}

		if (older) {
			// Earlier days: totals from the daily summaries. Filters cannot apply to them.
			const daily = await run(sql`select metric, sum(value) as n from analytics_daily
				where day >= ${iso(range.from)} and day < ${iso(cutoff)} group by metric`);
			const d = Object.fromEntries(daily.map((r) => [r.metric as string, num(r.n)]));
			out.pageviews += d.pageviews ?? 0;
			out.sessions += d.sessions ?? 0;
			for (const [event, key] of Object.entries(SERVER_TOTALS)) (out[key] as number) += d[DAILY_METRIC[event]!] ?? 0;
			out.visitors = null;
			out.bounceRate = null;
			out.avgEngagementMs = null;
			out.signedInVisitors = null;
			out.activeUsers = null;
		}
		return out;
	});
}

/* ----------------------------------------------------------------- series */

export interface DayPoint {
	day: string;
	pageviews: number;
	visitors: number;
	sessions: number;
	registrations: number;
	signins: number;
	signinFailures: number;
}

/** One point per day of the range, from raw events or, for expired days, the daily totals. */
export function series(range: Range, f: Filters = {}): Promise<DayPoint[]> {
	return cached(`series:${range.from.getTime()}:${range.to.getTime()}:${JSON.stringify(f)}`, async () => {
		const cutoff = rawCutoff();
		const raw: Range = { from: new Date(Math.max(range.from.getTime(), cutoff.getTime())), to: range.to };
		const days = new Map<string, DayPoint>();
		for (let t = range.from.getTime(); t < range.to.getTime(); t += DAY) {
			const day = iso(new Date(t));
			days.set(day, { day, pageviews: 0, visitors: 0, sessions: 0, registrations: 0, signins: 0, signinFailures: 0 });
		}
		const client = await run(sql`select (occurred_at at time zone 'UTC')::date as day, count(*) as pageviews,
				count(distinct visitor_id) as visitors, count(distinct session_id) as sessions
			from analytics_events where ${clientWhere(raw, f)} group by 1`);
		for (const r of client) {
			const p = days.get(iso(new Date(r.day as string)));
			if (p) Object.assign(p, { pageviews: num(r.pageviews), visitors: num(r.visitors), sessions: num(r.sessions) });
		}
		const server = await run(sql`select (occurred_at at time zone 'UTC')::date as day, name, count(*) as n
			from analytics_events where source = 'server' and occurred_at >= ${raw.from} and occurred_at < ${raw.to}
				and name in ('signup_completed', 'signin_succeeded', 'signin_failed') group by 1, 2`);
		for (const r of server) {
			const p = days.get(iso(new Date(r.day as string)));
			if (!p) continue;
			if (r.name === 'signup_completed') p.registrations = num(r.n);
			if (r.name === 'signin_succeeded') p.signins = num(r.n);
			if (r.name === 'signin_failed') p.signinFailures = num(r.n);
		}
		if (range.from < cutoff) {
			const daily = await run(sql`select day, metric, value from analytics_daily where day >= ${iso(range.from)} and day < ${iso(cutoff)}`);
			const map: Record<string, keyof DayPoint> = { pageviews: 'pageviews', visitors: 'visitors', sessions: 'sessions', registrations: 'registrations', signins: 'signins', signin_failures: 'signinFailures' };
			for (const r of daily) {
				const p = days.get(iso(new Date(r.day as string)));
				const key = map[r.metric as string];
				if (p && key) (p[key] as number) = num(r.value);
			}
		}
		return [...days.values()];
	});
}

/* ------------------------------------------------------------- breakdowns */

export interface Item {
	key: string;
	value: number;
	/** Secondary count, such as visitors for a page. */
	extra?: number;
}

export interface Breakdowns {
	pages: Item[];
	referrers: Item[];
	channels: Item[];
	devices: Item[];
	browsers: Item[];
	systems: Item[];
	events: Item[];
	failureReasons: Item[];
}

const LIMIT = 10;

/** Top values per dimension, over the retained raw events of the range. */
export function breakdowns(range: Range, f: Filters = {}): Promise<Breakdowns> {
	return cached(`breakdowns:${range.from.getTime()}:${range.to.getTime()}:${JSON.stringify(f)}`, async () => {
		const raw: Range = { from: new Date(Math.max(range.from.getTime(), rawCutoff().getTime())), to: range.to };
		const where = clientWhere(raw, f);
		const by = async (column: SQL, measure: SQL, extra?: SQL, filter: SQL = sql`true`) =>
			(
				await run(sql`select ${column} as key, ${measure} as value${extra ? sql`, ${extra} as extra` : sql``}
				from analytics_events where ${where} and ${filter} and ${column} is not null
				group by 1 order by 2 desc, 1 limit ${LIMIT}`)
			).map((r) => ({ key: String(r.key), value: num(r.value), ...(extra ? { extra: num(r.extra) } : {}) }));
		const visitors = sql`count(distinct visitor_id)`;
		const [pages, referrers, channels, devices, browsers, systems] = await Promise.all([
			by(sql`coalesce(route, path)`, sql`count(*)`, visitors),
			by(sql`referrer_host`, visitors, sql`count(*)`),
			by(sql`channel`, visitors, sql`count(*)`),
			by(sql`device`, visitors),
			by(sql`browser`, visitors),
			by(sql`os`, visitors)
		]);
		const events = (
			await run(sql`select name as key, count(*) as value from analytics_events
				where source = 'server' and occurred_at >= ${raw.from} and occurred_at < ${raw.to} group by 1 order by 2 desc`)
		).map((r) => ({ key: String(r.key), value: num(r.value) }));
		const failureReasons = (
			await run(sql`select coalesce(props->>'reason', 'unknown') as key, count(*) as value from analytics_events
				where source = 'server' and name = 'signin_failed' and occurred_at >= ${raw.from} and occurred_at < ${raw.to}
				group by 1 order by 2 desc`)
		).map((r) => ({ key: String(r.key), value: num(r.value) }));
		return { pages, referrers, channels, devices, browsers, systems, events, failureReasons };
	});
}

/** Pages seen in the range, for the page filter. */
export function knownRoutes(range: Range): Promise<string[]> {
	return cached(`routes:${range.from.getTime()}:${range.to.getTime()}`, async () =>
		(
			await run(sql`select distinct coalesce(route, path) as r from analytics_events
				where source = 'client' and name = 'pageview' and occurred_at >= ${range.from} and occurred_at < ${range.to} order by 1 limit 200`)
		).map((r) => String(r.r))
	);
}

/* ------------------------------------------------------------ comparisons */

/** Percentage change vs the previous period. Null when that period wasn't fully collected or was zero. */
export function change(current: number | null, previous: number | null, comparable: boolean): number | null {
	if (!comparable || current == null || previous == null || previous === 0) return null;
	return ((current - previous) / previous) * 100;
}

/** The period of the same length immediately before a range. */
export const previousOf = (r: Range): Range => ({ from: new Date(r.from.getTime() - (r.to.getTime() - r.from.getTime())), to: r.from });

/* ----------------------------------------------------------------- events */

export interface EventFilters extends Filters {
	name?: string | null;
	source?: 'client' | 'server' | null;
	session?: string | null;
	browser?: string | null;
	os?: string | null;
	referrer?: string | null;
}

export interface EventRow {
	id: string;
	occurredAt: string;
	source: string;
	name: string;
	path: string | null;
	route: string | null;
	channel: string | null;
	referrerHost: string | null;
	device: string | null;
	browser: string | null;
	os: string | null;
	authenticated: boolean;
	sessionId: string | null;
	durationMs: number | null;
	props: Record<string, unknown> | null;
}

function eventWhere(range: Range, f: EventFilters): SQL {
	const parts: SQL[] = [sql`occurred_at >= ${range.from}`, sql`occurred_at < ${range.to}`];
	if (f.name) parts.push(sql`name = ${f.name}`);
	if (f.source) parts.push(sql`source = ${f.source}`);
	if (f.session) parts.push(sql`session_id = ${f.session}`);
	if (f.route) parts.push(sql`coalesce(route, path) = ${f.route}`);
	if (f.channel) parts.push(sql`channel = ${f.channel}`);
	if (f.device) parts.push(sql`device = ${f.device}`);
	if (f.browser) parts.push(sql`browser = ${f.browser}`);
	if (f.os) parts.push(sql`os = ${f.os}`);
	if (f.referrer) parts.push(sql`referrer_host = ${f.referrer}`);
	if (f.auth === 'signed-in') parts.push(sql`authenticated`);
	if (f.auth === 'anonymous') parts.push(sql`not authenticated`);
	return sql.join(parts, sql` and `);
}

const toEvent = (r: Row): EventRow => ({
	id: String(r.id),
	occurredAt: new Date(r.occurred_at as string).toISOString(),
	source: String(r.source),
	name: String(r.name),
	path: (r.path as string) ?? null,
	route: (r.route as string) ?? null,
	channel: (r.channel as string) ?? null,
	referrerHost: (r.referrer_host as string) ?? null,
	device: (r.device as string) ?? null,
	browser: (r.browser as string) ?? null,
	os: (r.os as string) ?? null,
	authenticated: !!r.authenticated,
	sessionId: (r.session_id as string) ?? null,
	durationMs: r.duration_ms == null ? null : num(r.duration_ms),
	props: (r.props as Record<string, unknown>) ?? null
});

const COLUMNS = sql`id, occurred_at, source, name, path, route, channel, referrer_host, device, browser, os, authenticated, session_id, duration_ms, props`;

/** Events page, newest first, keyset pagination (`cursor` = last row). Total counted up to 10,000. */
export async function listEvents(range: Range, f: EventFilters, cursor: { at: string; id: string } | null, pageSize = 50) {
	const where = eventWhere(range, f);
	const after = cursor ? sql` and (occurred_at, id) < (${new Date(cursor.at)}, ${cursor.id})` : sql``;
	const rows = await run(sql`select ${COLUMNS} from analytics_events where ${where}${after}
		order by occurred_at desc, id desc limit ${pageSize + 1}`);
	const [count] = await run(sql`select count(*) as n from (select 1 from analytics_events where ${where} limit 10001) t`);
	const page = rows.slice(0, pageSize).map(toEvent);
	const last = page.at(-1);
	return {
		events: page,
		next: rows.length > pageSize && last ? { at: last.occurredAt, id: last.id } : null,
		total: num(count?.n),
		capped: num(count?.n) > 10_000
	};
}

/** Events for export, newest first, at most `limit`. */
export async function exportEvents(range: Range, f: EventFilters, limit = 10_000): Promise<EventRow[]> {
	return (await run(sql`select ${COLUMNS} from analytics_events where ${eventWhere(range, f)} order by occurred_at desc, id desc limit ${limit}`)).map(toEvent);
}
