import { fail, redirect } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import {
	consumeRecoveryCode,
	createSession,
	deleteUserSessions,
	findUserByEmail,
	hashPassword,
	setSessionCookie
} from '#lib/server/auth.ts';
import { guardForm, humanCheck } from '#lib/server/bot/guard.ts';
import { issueTicket } from '#lib/server/bot/ticket.ts';
import { recordAbuse } from '#lib/server/bot/risk.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import { emailSchema, passwordSchema } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

const INVALID = 'The email address or recovery code is incorrect.';

export const load: PageServerLoad = async (event) => ({ human: humanCheck(event, 'reset') });

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, getClientAddress, url } = event;
		const form = await request.formData();
		// Tickets are single-use: every refusal carries a fresh one for the next attempt.
		const again = <T extends Record<string, unknown>>(status: number, data: T) =>
			fail(status, { ...data, ticket: issueTicket('reset', request.headers.get('user-agent')) });
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const values = { email };

		const ip = getClientAddress();
		const ipLimit = rateLimit(`reset:ip:${ip}`, 6, 60 * 60 * 1000);
		const emailLimit = rateLimit(`reset:email:${email}`, 5, 60 * 60 * 1000);
		if (!ipLimit.ok || !emailLimit.ok) {
			await logSecurity('rate_limited', { ip, detail: 'reset' });
			return again(429, { values, errors: { form: rateLimitMessage(Math.max(ipLimit.retryAfter, emailLimit.retryAfter)) } });
		}
		const guard = await guardForm(event, form, 'reset');
		if (!guard.ok) {
			return again(guard.status, { values, challenge: guard.challenge, fallback: guard.fallback, errors: { [guard.field]: guard.message } });
		}

		const password = String(form.get('password') ?? '');
		const errors: Record<string, string> = {};
		const parsed = passwordSchema.safeParse(password);
		if (!parsed.success) errors.password = parsed.error.issues[0]!.message;
		if (form.get('confirmPassword') !== password) errors.confirmPassword = 'The passwords do not match.';
		if (Object.keys(errors).length) return again(400, { values, errors });

		const user = emailSchema.safeParse(email).success ? await findUserByEmail(email) : null;
		if (!user || !(await consumeRecoveryCode(user.id, String(form.get('code') ?? '')))) {
			recordAbuse(ip, 'reset');
			return again(400, { values, errors: { form: INVALID } });
		}

		await (await db())
			.update(schema.users)
			.set({ passwordHash: await hashPassword(password), passwordChangedAt: new Date(), failedLogins: 0, lockedUntil: null })
			.where(eq(schema.users.id, user.id));
		await deleteUserSessions(user.id);
		await logSecurity('password_reset', { userId: user.id, ip, userAgent: request.headers.get('user-agent') });
		track('password_reset', { userId: user.id });
		const session = await createSession(user.id, request.headers.get('user-agent'));
		setSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:');
		redirect(303, '/account/security?reset=1');
	}
};
