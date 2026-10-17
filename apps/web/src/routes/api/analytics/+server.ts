import { error, json } from '@sveltejs/kit';
import { analyticsEnabled } from '#lib/server/analytics/config.ts';
import { batchSchema, ingest } from '#lib/server/analytics/ingest.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import type { RequestHandler } from './$types';

/**
 * Receives page views and engagement from the browser, sent only after the visitor agreed to
 * analytics. Same-origin JSON is enforced for every API request in hooks.server.ts. Malformed
 * batches are refused as a whole; valid ones are stored without delaying the page.
 */
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!analyticsEnabled()) return new Response(null, { status: 204 });
	// Per address, per network, and for the whole site: events are stored for anyone who allowed
	// analytics, so the total written per period is bounded however many addresses send them.
	const ip = getClientAddress();
	const window = 10 * 60 * 1000;
	if (!rateLimit(`analytics:${ip}`, 240, window).ok) error(429, 'Too many requests.');
	if (Number(request.headers.get('content-length') ?? 0) > 32_768) error(413, 'Too large.');
	const parsed = batchSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) error(400, 'Invalid events.');
	// Only batches that would be stored count towards the network and site-wide limits. Under a
	// flood that reaches the site-wide limit, analytics is what gives way, never the site itself.
	if (!rateLimit(`analytics:net:${networkOf(ip)}`, 1_200, window).ok || !rateLimit('analytics:all', 20_000, window).ok) {
		error(429, 'Too many requests.');
	}
	try {
		const accepted = await ingest(parsed.data.events, { userId: locals.user?.id ?? null, userAgent: request.headers.get('user-agent') });
		return json({ accepted }, { status: 202 });
	} catch {
		// Analytics must never surface as an error in the page.
		return json({ accepted: 0 }, { status: 202 });
	}
};
