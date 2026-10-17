import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

/**
 * Health check for the host or load balancer: 200 when the server can reach its database, 503
 * otherwise. It reveals nothing else (no versions, timings or error details).
 */
export const GET: RequestHandler = async () => {
	const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
	try {
		await (await db()).execute(sql`select 1`);
		return new Response('{"status":"ok"}', { headers });
	} catch {
		return new Response('{"status":"unavailable"}', { status: 503, headers });
	}
};
