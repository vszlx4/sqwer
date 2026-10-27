import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import type { RequestHandler } from './$types';

/** Health check: 200 with database reachable, else 503. No other details. */
export const GET: RequestHandler = async () => {
	const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
	try {
		await (await db()).execute(sql`select 1`);
		return new Response('{"status":"ok"}', { headers });
	} catch {
		return new Response('{"status":"unavailable"}', { status: 503, headers });
	}
};
