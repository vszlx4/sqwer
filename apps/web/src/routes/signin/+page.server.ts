import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { logSecurity } from '#lib/server/security-log.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { createSession, dummyPasswordHash, findUserByEmail, setSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { verifyCaptcha } from '#lib/server/captcha.ts';
import { failureLimit, rateLimit, rateLimitMessage, recordFailure } from '#lib/server/rate-limit.ts';
import { emailSchema, safeRedirect } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

const INVALID = 'The email address or password is incorrect.';
/** Failed attempts before an account is locked, and for how long. */
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, safeRedirect(url.searchParams.get('redirectTo'), '/account'));
	return {
		notice:
			url.searchParams.get('deleted') === '1'
				? 'Your account and its data have been deleted.'
				: url.searchParams.get('signedOut') === '1'
					? 'You have been signed out.'
					: null
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const values = { email };

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');
		// The per-email failure limit applies whether or not the account exists, so it reveals nothing.
		const emailKey = `signin:email:${email}`;
		const ipLimit = rateLimit(`signin:ip:${ip}`, 20, LOCK_MS);
		const emailLimit = failureLimit(emailKey, MAX_FAILURES, LOCK_MS);
		if (!ipLimit.ok || !emailLimit.ok) {
			await logSecurity('rate_limited', { ip, detail: 'signin' });
			return fail(429, { values, errors: { form: rateLimitMessage(Math.max(ipLimit.retryAfter, emailLimit.retryAfter)) } });
		}
		if (!(await verifyCaptcha(form.get('altcha')))) {
			await logSecurity('captcha_failed', { ip, detail: 'signin' });
			return fail(400, { values, errors: { captcha: 'Please complete the verification.' } });
		}
		const password = String(form.get('password') ?? '');
		if (!emailSchema.safeParse(email).success || !password) {
			recordFailure(emailKey);
			return fail(400, { values, errors: { form: INVALID } });
		}

		const user = await findUserByEmail(email);
		// Hash even when the account does not exist so timing does not reveal it.
		const ok = await verifyPassword(user?.passwordHash ?? (await dummyPasswordHash()), password);
		const d = await db();

		if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
			await logSecurity('sign_in_failed', { userId: user.id, ip, userAgent, detail: 'locked' });
			return fail(429, { values, errors: { form: rateLimitMessage((user.lockedUntil.getTime() - Date.now()) / 1000) } });
		}
		if (!user || !ok) {
			recordFailure(emailKey);
			if (user) {
				const failures = user.failedLogins + 1;
				const lock = failures >= MAX_FAILURES;
				await d
					.update(schema.users)
					.set({ failedLogins: lock ? 0 : failures, lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null })
					.where(eq(schema.users.id, user.id));
				await logSecurity(lock ? 'account_locked' : 'sign_in_failed', { userId: user.id, ip, userAgent });
			}
			return fail(400, { values, errors: { form: INVALID } });
		}

		await d.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
		await logSecurity('signed_in', { userId: user.id, ip, userAgent });
		const session = await createSession(user.id, userAgent);
		setSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:');

		const hasProfile = await d
			.select({ id: schema.profiles.userId })
			.from(schema.profiles)
			.where(eq(schema.profiles.userId, user.id))
			.limit(1);
		redirect(303, hasProfile.length ? safeRedirect(url.searchParams.get('redirectTo'), '/account') : '/account/setup');
	}
};
