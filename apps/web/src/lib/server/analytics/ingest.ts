import { z } from 'zod';
import { channelOf } from '#lib/analytics/shared.ts';
import { SITE_URL } from '../config.ts';
import { db, schema } from '../db/index.ts';
import { isBot, parseClient } from './ua.ts';

/*
 * Events from the browser. The page sends them only after the visitor has agreed to analytics
 * (lib/analytics/consent.svelte.ts). Every field is validated and normalised here; anything that
 * does not fit is refused as a whole batch. Who is signed in comes from the session, never from
 * the request body, and device, browser and system are read from the user agent here.
 */

const uuid = z.uuid();
const text = (max: number) => z.string().trim().max(max);

const eventSchema = z.object({
	/** Chosen by the browser; the same event sent twice is stored once. */
	id: uuid,
	type: z.enum(['pageview', 'engagement']),
	/** When it happened, in epoch milliseconds. */
	at: z.number().int(),
	path: z.string().max(300).regex(/^\/[^\s?#]*$/),
	route: z
		.string()
		.max(120)
		.regex(/^\/[\w\-/[\]().]*$/)
		.nullable()
		.optional(),
	referrer: text(500).optional(),
	utm: z.object({ source: text(100).optional(), medium: text(100).optional(), campaign: text(100).optional() }).optional(),
	visitor: uuid,
	session: uuid,
	/** For engagement: how long the page was visible. */
	duration: z
		.number()
		.int()
		.min(0)
		.max(6 * 60 * 60 * 1000)
		.optional()
});

export const batchSchema = z.object({ events: z.array(eventSchema).min(1).max(20) });
export type IncomingEvent = z.infer<typeof eventSchema>;

const ownHost = new URL(SITE_URL).hostname;

/** The referring site's host name, or null for direct visits and links within sqwer. */
export function referrerHost(referrer: string | undefined): string | null {
	if (!referrer) return null;
	try {
		const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
		return host && host !== ownHost.replace(/^www\./, '') && host !== 'localhost' ? host.slice(0, 120) : null;
	} catch {
		return null;
	}
}

export interface IngestContext {
	userId: string | null;
	userAgent: string | null;
	now?: number;
}

/** Stores a validated batch. Returns how many events were new; duplicates are ignored. */
export async function ingest(events: IncomingEvent[], ctx: IngestContext): Promise<number> {
	if (isBot(ctx.userAgent)) return 0;
	const now = ctx.now ?? Date.now();
	const client = parseClient(ctx.userAgent);
	const rows = events
		// Events are accepted from the last day up to a few minutes ahead (clock differences).
		.filter((e) => e.at > now - 24 * 60 * 60 * 1000 && e.at < now + 5 * 60 * 1000)
		.map((e) => {
			const host = referrerHost(e.referrer);
			const utm = { source: e.utm?.source || null, medium: e.utm?.medium || null, campaign: e.utm?.campaign || null };
			return {
				id: e.id,
				occurredAt: new Date(e.at),
				source: 'client',
				name: e.type,
				path: e.path,
				route: e.route ?? null,
				referrerHost: e.type === 'pageview' ? host : null,
				channel: e.type === 'pageview' ? channelOf(host, utm) : null,
				utmSource: utm.source,
				utmMedium: utm.medium,
				utmCampaign: utm.campaign,
				visitorId: e.visitor,
				sessionId: e.session,
				userId: ctx.userId,
				authenticated: !!ctx.userId,
				device: client.device,
				browser: client.browser,
				os: client.os,
				durationMs: e.type === 'engagement' ? (e.duration ?? null) : null
			};
		});
	if (!rows.length) return 0;
	const inserted = await (await db())
		.insert(schema.analyticsEvents)
		.values(rows)
		.onConflictDoNothing()
		.returning({ id: schema.analyticsEvents.id });
	return inserted.length;
}
