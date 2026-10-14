import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { requireUser } from '#lib/server/account.ts';
import {
	activeSessions,
	deleteSession,
	deleteUserSessions,
	hashPassword,
	issueRecoveryCodes,
	remainingRecoveryCodes,
	verifyPassword
} from '#lib/server/auth.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import { passwordSchema } from '#lib/server/validation.ts';
import { EVENT_LABELS, logSecurity, recentSecurityEvents } from '#lib/server/security-log.ts';
import type { Actions, PageServerLoad } from './$types';

async function checkPassword(userId: string, password: string) {
	const rows = await (await db()).select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
	return !!rows[0] && (await verifyPassword(rows[0].hash, password));
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const sessions = await activeSessions(user.id);
	const events = await recentSecurityEvents(user.id);
	return {
		events: events.map((e) => ({
			label: EVENT_LABELS[e.type as keyof typeof EVENT_LABELS] ?? e.type,
			device: e.device,
			at: e.createdAt.toISOString()
		})),
		reset: url.searchParams.get('reset') === '1',
		recoveryCodes: await remainingRecoveryCodes(user.id),
		sessions: sessions
			.map((s) => ({
				id: s.id,
				device: s.device,
				createdAt: s.createdAt.toISOString(),
				lastSeenAt: s.lastSeenAt.toISOString(),
				current: s.id === locals.sessionId
			}))
			.sort((a, b) => Number(b.current) - Number(a.current) || b.lastSeenAt.localeCompare(a.lastSeenAt))
	};
};

export const actions: Actions = {
	password: async ({ request, locals, url, getClientAddress }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const limit = rateLimit(`password:${user.id}`, 10, 60 * 60 * 1000);
		if (!limit.ok) return fail(429, { action: 'password', errors: { form: rateLimitMessage(limit.retryAfter) } });

		const current = String(form.get('currentPassword') ?? '');
		const next = String(form.get('newPassword') ?? '');
		const errors: Record<string, string> = {};
		if (!(await checkPassword(user.id, current))) errors.currentPassword = 'The current password is incorrect.';
		const parsed = passwordSchema.safeParse(next);
		if (!parsed.success) errors.newPassword = parsed.error.issues[0]!.message;
		else if (next === current) errors.newPassword = 'Choose a password that differs from the current one.';
		if (form.get('confirmPassword') !== next) errors.confirmPassword = 'The passwords do not match.';
		if (Object.keys(errors).length) return fail(400, { action: 'password', errors });

		await (await db())
			.update(schema.users)
			.set({ passwordHash: await hashPassword(next), passwordChangedAt: new Date() })
			.where(eq(schema.users.id, user.id));
		await deleteUserSessions(user.id, locals.sessionId ?? undefined);
		await logSecurity('password_changed', { userId: user.id, ip: getClientAddress(), userAgent: request.headers.get('user-agent') });
		return { action: 'password', success: 'Your password has been changed. All other devices have been signed out.' };
	},

	codes: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const limit = rateLimit(`codes:${user.id}`, 10, 60 * 60 * 1000);
		if (!limit.ok) return fail(429, { action: 'codes', errors: { form: rateLimitMessage(limit.retryAfter) } });
		if (!(await checkPassword(user.id, String(form.get('password') ?? '')))) {
			return fail(400, { action: 'codes', errors: { password: 'The password is incorrect.' } });
		}
		const codes = await issueRecoveryCodes(user.id);
		await logSecurity('recovery_codes_regenerated', { userId: user.id, userAgent: request.headers.get('user-agent') });
		return { action: 'codes', codes, email: user.email };
	},

	revoke: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const id = String((await request.formData()).get('id') ?? '');
		const owned = (await activeSessions(user.id)).some((s) => s.id === id);
		if (owned && id !== locals.sessionId) {
			await deleteSession(id);
			await logSecurity('session_revoked', { userId: user.id, userAgent: request.headers.get('user-agent') });
		}
		return { action: 'revoke', success: 'The device has been signed out.' };
	},

	revokeOthers: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		await deleteUserSessions(user.id, locals.sessionId ?? undefined);
		await logSecurity('other_sessions_revoked', { userId: user.id, userAgent: request.headers.get('user-agent') });
		return { action: 'revoke', success: 'All other devices have been signed out.' };
	}
};
