import { eq } from 'drizzle-orm';
import { deleteUserSessions } from './auth.ts';
import { db, schema } from './db/index.ts';
import { invalidateLeaderboards } from './progress.ts';
import { logSecurity } from './security-log.ts';

/*
 * Suspending an account: it cannot sign in, every session ends at once, password reset is refused,
 * and it disappears from leaderboards, public profiles and profile pictures. Nothing is deleted, so
 * lifting the suspension restores the account as it was.
 */

export const SUSPENDED_MESSAGE = 'This account has been suspended. If you believe this is a mistake, contact us.';

export interface ModerationTarget {
	id: string;
	email: string;
	role: string;
	suspendedAt: Date | null;
	suspendedReason: string | null;
}

export async function suspendUser(userId: string, reason: string, by: string | null): Promise<void> {
	const d = await db();
	await d
		.update(schema.users)
		.set({ suspendedAt: new Date(), suspendedReason: reason.slice(0, 500) })
		.where(eq(schema.users.id, userId));
	await deleteUserSessions(userId);
	invalidateLeaderboards();
	await logSecurity('account_suspended', { userId, detail: by ? `by:${by}` : 'cli' });
}

export async function unsuspendUser(userId: string, by: string | null): Promise<void> {
	await (await db()).update(schema.users).set({ suspendedAt: null, suspendedReason: null }).where(eq(schema.users.id, userId));
	invalidateLeaderboards();
	await logSecurity('account_unsuspended', { userId, detail: by ? `by:${by}` : 'cli' });
}
