import { requireAdmin } from '#lib/server/admin.ts';
import { readFilters, readPeriod } from '#lib/server/analytics/params.ts';
import { breakdowns, change, coverage, knownRoutes, previousOf, series, summary, type Summary } from '#lib/server/analytics/query.ts';
import type { PageServerLoad } from './$types';

const CLIENT_KEYS: (keyof Summary)[] = ['pageviews', 'visitors', 'sessions', 'bounceRate', 'avgEngagementMs', 'signedInVisitors', 'activeUsers'];

export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url);
	const period = readPeriod(url.searchParams);
	const filters = readFilters(url.searchParams);
	try {
		const prev = previousOf(period.range);
		const [cov, current, previous, days, top, routes] = await Promise.all([
			coverage(),
			summary(period.range, filters),
			summary(prev, filters),
			series(period.range, filters),
			breakdowns(period.range, filters),
			knownRoutes(period.range)
		]);
		// A comparison is shown only when data was being collected for the whole previous period.
		const clientComparable = !!cov.clientSince && new Date(cov.clientSince) <= prev.from;
		const serverComparable = !!cov.serverSince && new Date(cov.serverSince) <= prev.from;
		const changes = Object.fromEntries(
			(Object.keys(current) as (keyof Summary)[]).map((k) => [
				k,
				change(current[k], previous[k], CLIENT_KEYS.includes(k) ? clientComparable : serverComparable)
			])
		) as Record<keyof Summary, number | null>;
		return { period, filters, coverage: cov, summary: current, previous, changes, series: days, top, routes, error: null };
	} catch (e) {
		console.error(JSON.stringify({ kind: 'analytics', task: 'dashboard', error: String((e as Error)?.message ?? e).slice(0, 200) }));
		return { period, filters, coverage: null, summary: null, previous: null, changes: null, series: [], top: null, routes: [], error: 'The analytics could not be loaded. Try again in a moment.' };
	}
};
