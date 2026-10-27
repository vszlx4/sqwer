import { error, json } from '@sveltejs/kit';
import { analyticsEnabled } from '#lib/server/analytics/config.ts';
import { batchSchema, ingest } from '#lib/server/analytics/ingest.ts';
import { checkAnalyticsToken } from '#lib/server/analytics/token.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

/**
 * Browser analytics intake (after consent). Same-origin JSON and 32 KB enforced in hooks.server.ts. Order:
 * 1. per-address limit; 2. zod validation; 3. valid page-load token (lib/server/analytics/token.ts);
 * 4. per-token and per-visit limits; 5. network and site-wide limits, counted only for batches that passed.
 */
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!analyticsEnabled()) return new Response(null, { status: 204 });
	// Per address, network and site: bounds total writes regardless of address count.
	const ip = getClientAddress();
	const window = 10 * 60 * 1000;
	if (!rateLimit(`analytics:${ip}`, 240, window).ok) error(429, 'Too many requests.');
	if (Number(request.headers.get('content-length') ?? 0) > 32_768) error(413, 'Too large.');
	const body = (await request.json().catch(() => null)) as { token?: unknown; events?: unknown } | null;
	const parsed = batchSchema.safeParse(body ? { events: body.events } : null);
	if (!parsed.success) error(400, 'Invalid events.');
	const userAgent = request.headers.get('user-agent');
	const tokenId = checkAnalyticsToken(body?.token, userAgent);
	if (!tokenId) error(403, 'Invalid analytics token.');
	const hour = 60 * 60 * 1000;
	// A page load's token covers a normal visit (a batch every few seconds at most), not a flood.
	if (!rateLimit(`analytics:token:${tokenId}`, 150, hour).ok) error(429, 'Too many requests.');
	for (const session of new Set(parsed.data.events.map((e) => e.session))) {
		if (!rateLimit(`analytics:visit:${session}`, 150, hour).ok) error(429, 'Too many requests.');
	}
	// Only storable batches count toward network and site limits. At the site cap, analytics is dropped first.
	if (!rateLimit(`analytics:net:${networkOf(ip)}`, 1_200, window).ok || !rateLimit('analytics:all', 20_000, window).ok) {
		error(429, 'Too many requests.');
	}
	try {
		const accepted = await ingest(parsed.data.events, { userId: locals.user?.id ?? null, userAgent });
		return json({ accepted }, { status: 202 });
	} catch {
		// Analytics must never surface as an error in the page.
		return json({ accepted: 0 }, { status: 202 });
	}
};
