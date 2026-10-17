import { error } from '@sveltejs/kit';
import { requireAdminApi } from '#lib/server/admin.ts';
import { readEventFilters, readPeriod } from '#lib/server/analytics/params.ts';
import { csvCell } from '#lib/server/analytics/csv.ts';
import { exportEvents } from '#lib/server/analytics/query.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { addressOf, logSecurity } from '#lib/server/security-log.ts';
import type { RequestHandler } from './$types';

/*
 * The events of the chosen period and filters as CSV, at most 10,000 rows, for administrators.
 * Account and visitor identifiers are never exported.
 */

const COLUMNS = ['time_utc', 'source', 'event', 'page', 'route', 'channel', 'referrer', 'device', 'browser', 'os', 'signed_in', 'visit', 'visible_ms', 'details'] as const;

export const GET: RequestHandler = async (event) => {
	const { locals, url } = event;
	const admin = requireAdminApi(locals);
	if (!rateLimit(`admin-export:${admin.id}`, 30, 60 * 60 * 1000).ok) error(429, 'Too many exports. Please try again later.');
	const period = readPeriod(url.searchParams);
	const rows = await exportEvents(period.range, readEventFilters(url.searchParams));
	await logSecurity('admin_export', { userId: admin.id, ip: addressOf(event), detail: `${period.fromDay}..${period.toDay}:${rows.length}` });
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
