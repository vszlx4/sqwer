import { error, json } from '@sveltejs/kit';
import { analyticsEnabled } from '#lib/server/analytics/config.ts';
import { batchSchema, ingest } from '#lib/server/analytics/ingest.ts';
import { checkAnalyticsToken } from '#lib/server/analytics/token.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

/**
 * Receives page views and engagement from the browser, sent only after the visitor agreed to
 * analytics. Same-origin JSON and a 32 KB body are enforced in hooks.server.ts. In order:
 *
 * 1. a limit per address; 2. the batch must be valid (zod); 3. it must carry a genuine analytics
 * token issued with a page load to this browser (lib/server/analytics/token.ts); 4. limits per token
 * and per visit; 5. limits per network and for the whole site, counted only for batches that passed
 * everything else, so forged requests cannot use them up.
 */
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!analyticsEnabled()) return new Response(null, { status: 204 });
	// Per address, per network, and for the whole site: events are stored for anyone who allowed
	// analytics, so the total written per period is bounded however many addresses send them.
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
	// Only batches that would be stored count towards the network and site-wide limits. Under a
	// flood that reaches the site-wide limit, analytics is what gives way, never the site itself.
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
