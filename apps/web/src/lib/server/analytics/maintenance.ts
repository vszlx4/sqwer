import { sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { retentionDays } from './config.ts';

/*
 * Background upkeep, run a minute after start-up and then every six hours:
 *
 * 1. Daily totals: each finished day is summarised into analytics_daily once its events can no
 *    longer arrive (events up to a day old are accepted, so a day is summarised two days later).
 *    These totals contain no personal data and are kept after the raw events expire.
 * 2. Retention: raw events older than the retention period (13 months by default) are deleted, in
 *    batches, so the table stays bounded and no single statement locks it for long.
 */

const DAY = 24 * 60 * 60 * 1000;
type Row = Record<string, unknown>;
const rowsOf = (r: unknown) => (r as { rows: Row[] }).rows;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Summarises up to `maxDays` finished days not yet summarised. Returns the days written. */
export async function rollUp(now = Date.now(), maxDays = 60): Promise<string[]> {
	const d = await db();
	const [first] = rowsOf(await d.execute(sql`select min(occurred_at) as t from analytics_events`));
	if (!first?.t) return [];
	const start = new Date(Math.floor(new Date(first.t as string).getTime() / DAY) * DAY);
	const last = new Date(Math.floor(now / DAY) * DAY - 2 * DAY);
	if (start > last) return [];
	const pending = rowsOf(
		await d.execute(sql`select g::date as day from generate_series(${iso(start)}::date, ${iso(last)}::date, interval '1 day') g
			where not exists (select 1 from analytics_daily a where a.day = g::date and a.metric = 'pageviews')
			order by 1 limit ${maxDays}`)
	).map((r) => iso(new Date(r.day as string)));
	for (const day of pending) {
		const from = new Date(`${day}T00:00:00Z`);
		const to = new Date(from.getTime() + DAY);
		await d.execute(sql`insert into analytics_daily (day, metric, value)
			select ${day}::date, m.metric, m.value from (
				select 'pageviews' as metric, count(*)::int as value from analytics_events where source = 'client' and name = 'pageview' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'visitors', count(distinct visitor_id)::int from analytics_events where source = 'client' and name = 'pageview' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'sessions', count(distinct session_id)::int from analytics_events where source = 'client' and name = 'pageview' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'registrations', count(*)::int from analytics_events where source = 'server' and name = 'signup_completed' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'signins', count(*)::int from analytics_events where source = 'server' and name = 'signin_succeeded' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'signin_failures', count(*)::int from analytics_events where source = 'server' and name = 'signin_failed' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'tests', count(*)::int from analytics_events where source = 'server' and name = 'test_completed' and occurred_at >= ${from} and occurred_at < ${to}
				union all select 'lessons', count(*)::int from analytics_events where source = 'server' and name = 'lesson_completed' and occurred_at >= ${from} and occurred_at < ${to}
			) m
			on conflict (day, metric) do update set value = excluded.value`);
	}
	return pending;
}

/** Deletes raw events older than the retention period, in batches. Returns how many were deleted. */
export async function purgeExpired(now = Date.now(), batch = 5000, maxBatches = 40): Promise<number> {
	const d = await db();
	const cutoff = new Date(Math.floor((now - retentionDays() * DAY) / DAY) * DAY);
	let total = 0;
	for (let i = 0; i < maxBatches; i++) {
		const deleted = rowsOf(
			await d.execute(sql`delete from analytics_events where id in (
				select id from analytics_events where occurred_at < ${cutoff} limit ${batch}) returning id`)
		).length;
		total += deleted;
		if (deleted < batch) break;
	}
	return total;
}

let timer: ReturnType<typeof setInterval> | null = null;

/** Starts the background upkeep once per server process. Failures are logged, never thrown. */
export function startAnalyticsMaintenance() {
	if (timer) return;
	const runOnce = async () => {
		try {
			await rollUp();
			await purgeExpired();
		} catch (e) {
			console.warn(JSON.stringify({ kind: 'analytics', task: 'maintenance', error: String((e as Error)?.message ?? e).slice(0, 200) }));
		}
	};
	setTimeout(runOnce, 60_000).unref?.();
	timer = setInterval(runOnce, 6 * 60 * 60 * 1000);
	timer.unref?.();
}
