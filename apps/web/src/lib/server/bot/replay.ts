import { createHash } from 'node:crypto';
import { lt } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';

/* Single-use tokens in the database (survives restarts, shared across processes). Hash only, until expiry. */

let lastPurge = 0;
const PURGE_EVERY_MS = 10 * 60 * 1000;

const keyOf = (kind: string, value: string) => createHash('sha256').update(`${kind}\u0000${value}`).digest('base64url');

/** Marks a token used. True the first time, false afterwards; atomic. */
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
