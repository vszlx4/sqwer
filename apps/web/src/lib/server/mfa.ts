import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { verifyPassword } from './auth.ts';
import { db, schema } from './db/index.ts';
import { failureLimit, rateLimit, recordFailure } from './rate-limit.ts';
import { logSecurity } from './security-log.ts';
import { decryptSecret, encryptSecret, newTotpSecret, verifyCode } from './totp.ts';

/*
 * Authenticator-app set-up and checks for administrators (see lib/server/admin.ts). Set-up asks for
 * the password again before a secret is shown, so a borrowed session cannot quietly add its own
 * authenticator. Codes are limited per account, and each accepted time step is recorded with a
 * conditional update, so a code is accepted once even by two simultaneous requests.
 */

const ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export type CodeOutcome = 'ok' | 'invalid' | 'limited';

async function userRow(userId: string) {
	const [row] = await (await db())
		.select({ hash: schema.users.passwordHash, secret: schema.users.totpSecret, pending: schema.users.totpPending, lastStep: schema.users.totpLastStep })
		.from(schema.users)
		.where(eq(schema.users.id, userId))
		.limit(1);
	return row ?? null;
}

/** Records a step as used, only if it is newer than the last one; false if another request was first. */
async function claimStep(userId: string, step: number): Promise<boolean> {
	const rows = await (await db())
		.update(schema.users)
		.set({ totpLastStep: step })
		.where(and(eq(schema.users.id, userId), or(isNull(schema.users.totpLastStep), lt(schema.users.totpLastStep, step))))
		.returning({ id: schema.users.id });
	return rows.length === 1;
}

async function markSession(sessionId: string | null) {
	if (sessionId) await (await db()).update(schema.sessions).set({ mfaVerifiedAt: new Date() }).where(eq(schema.sessions.id, sessionId));
}

function limited(userId: string): boolean {
	return !failureLimit(`mfa:${userId}`, ATTEMPTS, WINDOW_MS).ok || !rateLimit(`mfa-requests:${userId}`, 30, WINDOW_MS).ok;
}

/** Step 1 of set-up: after the password, a new secret (kept as pending until confirmed). */
export async function startSetup(userId: string, password: string): Promise<{ secret: string } | 'invalid' | 'limited'> {
	if (limited(userId)) return 'limited';
	const row = await userRow(userId);
	if (!row || !(await verifyPassword(row.hash, password))) {
		recordFailure(`mfa:${userId}`);
		await logSecurity('mfa_failed', { userId, detail: 'setup-password' });
		return 'invalid';
	}
	const secret = newTotpSecret();
	await (await db()).update(schema.users).set({ totpPending: encryptSecret(secret) }).where(eq(schema.users.id, userId));
	return { secret };
}

/** Step 2 of set-up: a code from the app proves it holds the pending secret. */
export async function confirmSetup(userId: string, sessionId: string | null, code: string): Promise<CodeOutcome> {
	if (limited(userId)) return 'limited';
	const row = await userRow(userId);
	if (!row?.pending) return 'invalid';
	const step = verifyCode(decryptSecret(row.pending), code, row.lastStep);
	if (step === null || !(await claimStep(userId, step))) {
		recordFailure(`mfa:${userId}`);
		await logSecurity('mfa_failed', { userId, detail: 'setup-code' });
		return 'invalid';
	}
	await (await db())
		.update(schema.users)
		.set({ totpSecret: row.pending, totpPending: null, totpEnabledAt: new Date() })
		.where(eq(schema.users.id, userId));
	await markSession(sessionId);
	await logSecurity('mfa_enabled', { userId });
	return 'ok';
}

/** The check for each session. */
export async function verifyAdminCode(userId: string, sessionId: string | null, code: string): Promise<CodeOutcome> {
	if (limited(userId)) return 'limited';
	const row = await userRow(userId);
	if (!row?.secret) return 'invalid';
	const step = verifyCode(decryptSecret(row.secret), code, row.lastStep);
	if (step === null || !(await claimStep(userId, step))) {
		recordFailure(`mfa:${userId}`);
		await logSecurity('mfa_failed', { userId, detail: 'check' });
		return 'invalid';
	}
	await markSession(sessionId);
	return 'ok';
}
