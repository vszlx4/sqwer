import { createHmac } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { secret } from './config.ts';
import { db, schema } from './db/index.ts';
import { describeDevice } from './auth.ts';

export type SecurityEvent =
	| 'account_created'
	| 'signed_in'
	| 'sign_in_failed'
	| 'account_locked'
	| 'signed_out'
	| 'password_changed'
	| 'password_reset'
	| 'recovery_codes_regenerated'
	| 'session_revoked'
	| 'other_sessions_revoked'
	| 'profile_updated'
	| 'account_deleted'
	| 'data_cleared'
	| 'captcha_failed'
	| 'rate_limited'
	| 'bot_trap'
	| 'data_exported'
	| 'admin_export'
	| 'admin_denied'
	| 'admin_action'
	| 'account_suspended'
	| 'account_unsuspended'
	| 'mfa_enabled'
	| 'mfa_failed'
	| 'mfa_reset'
	| 'result_rejected';

/** Events stored with the account and shown on its Security page. */
const ACCOUNT_VISIBLE = new Set<SecurityEvent>([
	'account_created',
	'signed_in',
	'sign_in_failed',
	'account_locked',
	'password_changed',
	'password_reset',
	'recovery_codes_regenerated',
	'session_revoked',
	'other_sessions_revoked',
	'data_cleared',
	'data_exported',
	'account_suspended',
	'account_unsuspended',
	'mfa_enabled',
	'mfa_failed',
	'mfa_reset'
]);

export const EVENT_LABELS: Partial<Record<SecurityEvent, string>> = {
	account_created: 'Account created',
	signed_in: 'Signed in',
	sign_in_failed: 'Failed sign-in attempt',
	account_locked: 'Sign-in temporarily locked after repeated failures',
	password_changed: 'Password changed',
	password_reset: 'Password reset with a recovery code',
	recovery_codes_regenerated: 'New recovery codes generated',
	session_revoked: 'A device was signed out',
	other_sessions_revoked: 'All other devices were signed out',
	data_cleared: 'Part of your data was cleared',
	data_exported: 'Your data was downloaded',
	account_suspended: 'The account was suspended',
	account_unsuspended: 'The suspension was lifted',
	mfa_enabled: 'Authenticator app set up',
	mfa_failed: 'Wrong authenticator code',
	mfa_reset: 'Authenticator app removed'
};

/** Client address for logs, or undefined when unreadable. Never throws. */
export function addressOf(event: { getClientAddress: () => string }): string | undefined {
	try {
		return event.getClientAddress();
	} catch {
		return undefined;
	}
}

/** IP addresses are logged only as a keyed hash, enough to correlate abuse without storing the address. */
function hashIp(ip: string | undefined) {
	if (!ip) return undefined;
	return createHmac('sha256', secret('LOG_HASH_SECRET')).update(ip).digest('hex').slice(0, 16);
}

export async function logSecurity(
	event: SecurityEvent,
	ctx: { userId?: string; ip?: string; userAgent?: string | null; detail?: string } = {}
) {
	// Structured line for the server log (collected by the host).
	console.info(
		JSON.stringify({
			at: new Date().toISOString(),
			kind: 'security',
			event,
			userId: ctx.userId,
			ip: hashIp(ctx.ip),
			detail: ctx.detail
		})
	);
	if (ctx.userId && ACCOUNT_VISIBLE.has(event)) {
		try {
			await (await db())
				.insert(schema.securityEvents)
				.values({ userId: ctx.userId, type: event, device: describeDevice(ctx.userAgent ?? null) });
		} catch {
			// Logging must never block the request.
		}
	}
}

export async function recentSecurityEvents(userId: string, limit = 12) {
	return (await db())
		.select({ type: schema.securityEvents.type, device: schema.securityEvents.device, createdAt: schema.securityEvents.createdAt })
		.from(schema.securityEvents)
		.where(eq(schema.securityEvents.userId, userId))
		.orderBy(desc(schema.securityEvents.createdAt))
		.limit(limit);
}
