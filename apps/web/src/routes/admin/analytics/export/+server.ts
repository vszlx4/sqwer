import { requireAdminApi } from '#lib/server/admin.ts';
import { readEventFilters, readPeriod } from '#lib/server/analytics/params.ts';
import { csvCell } from '#lib/server/analytics/csv.ts';
import { exportEvents } from '#lib/server/analytics/query.ts';
import type { RequestHandler } from './$types';

/*
 * The events of the chosen period and filters as CSV, at most 10,000 rows, for administrators.
 * Account and visitor identifiers are never exported.
 */

const COLUMNS = ['time_utc', 'source', 'event', 'page', 'route', 'channel', 'referrer', 'device', 'browser', 'os', 'signed_in', 'visit', 'visible_ms', 'details'] as const;

export const GET: RequestHandler = async ({ locals, url }) => {
	requireAdminApi(locals);
	const period = readPeriod(url.searchParams);
	const rows = await exportEvents(period.range, readEventFilters(url.searchParams));
	const lines = [COLUMNS.join(',')];
	for (const e of rows) {
		lines.push(
			[
				e.occurredAt,
				e.source,
				e.name,
				e.path,
				e.route,
				e.channel,
				e.referrerHost,
				e.device,
				e.browser,
				e.os,
				e.authenticated ? 'yes' : 'no',
				e.sessionId,
				e.durationMs,
				e.props ? JSON.stringify(e.props) : null
			]
				.map(csvCell)
				.join(',')
		);
	}
	return new Response(`${lines.join('\r\n')}\r\n`, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="sqwer-analytics-${period.fromDay}-to-${period.toDay}.csv"`,
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
