import { createHash } from 'node:crypto';
import { lt } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';

/*
 * One-time use of tokens, recorded in the database so that it holds across restarts and across
 * server processes. Only a hash of the token is stored, and only until the token would have
 * expired anyway.
 */

let lastPurge = 0;
const PURGE_EVERY_MS = 10 * 60 * 1000;

const keyOf = (kind: string, value: string) => createHash('sha256').update(`${kind}\u0000${value}`).digest('base64url');

/**
 * Marks a token as used. Resolves to true the first time and to false for every later attempt,
 * atomically: of two simultaneous uses, exactly one succeeds.
 */
export async function consumeOnce(kind: string, value: string, expiresAt: number): Promise<boolean> {
	const d = await db();
	const now = Date.now();
	if (now - lastPurge > PURGE_EVERY_MS) {
		lastPurge = now;
		d.delete(schema.usedTokens)
			.where(lt(schema.usedTokens.expiresAt, new Date(now)))
			.catch(() => {});
	}
	const rows = await d
		.insert(schema.usedTokens)
		.values({ key: keyOf(kind, value), expiresAt: new Date(Math.max(expiresAt, now + 60_000)) })
		.onConflictDoNothing()
		.returning({ key: schema.usedTokens.key });
	return rows.length === 1;
}
