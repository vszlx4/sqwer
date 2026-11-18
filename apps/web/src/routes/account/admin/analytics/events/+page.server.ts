import { requireAdmin } from '#lib/server/admin.ts';
import { readCursor, readEventFilters, readPeriod } from '#lib/server/analytics/params.ts';
import { knownRoutes, listEvents } from '#lib/server/analytics/query.ts';
import type { PageServerLoad } from './$types';

/** Individual events, newest first, filtered and paged by keyset cursor. Administrators only. */
export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url);
	const period = readPeriod(url.searchParams);
	const filters = readEventFilters(url.searchParams);
	const cursor = readCursor(url.searchParams);
	try {
		const [list, routes] = await Promise.all([listEvents(period.range, filters, cursor), knownRoutes(period.range)]);
		return { period, filters, cursor, routes, ...list, error: null };
	} catch (e) {
		console.error(JSON.stringify({ kind: 'analytics', task: 'events', error: String((e as Error)?.message ?? e).slice(0, 200) }));
		return { period, filters, cursor, routes: [], events: [], next: null, total: 0, capped: false, error: 'The events could not be loaded. Try again in a moment.' };
	}
};
