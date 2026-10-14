import { fail, redirect } from '@sveltejs/kit';
import { db, schema } from '#lib/server/db/index.ts';
import {
	createSession,
	findUserByEmail,
	hashPassword,
	issueRecoveryCodes,
	newUserId,
	setSessionCookie
} from '#lib/server/auth.ts';
import { verifyCaptcha } from '#lib/server/captcha.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import { emailSchema, passwordSchema } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

/** Forms submitted faster than this are almost certainly automated. */
const MIN_FILL_MS = 2500;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/account');
	return { startedAt: Date.now() };
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const values = { email };

		const ip = getClientAddress();
		const limit = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
		if (!limit.ok) {
			await logSecurity('rate_limited', { ip, detail: 'signup' });
			return fail(429, { values, errors: { form: rateLimitMessage(limit.retryAfter) } });
		}

		// Bot traps: a hidden field people never fill in, and a minimum fill time.
		const startedAt = Number(form.get('startedAt') ?? 0);
		if (form.get('website') || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
			await logSecurity('bot_trap', { ip, detail: 'signup' });
			return fail(400, { values, errors: { form: 'The form could not be submitted. Please try again.' } });
		}
		if (!(await verifyCaptcha(form.get('altcha')))) {
			await logSecurity('captcha_failed', { ip, detail: 'signup' });
			return fail(400, { values, errors: { captcha: 'Please complete the verification.' } });
		}

		const errors: Record<string, string> = {};
		const parsedEmail = emailSchema.safeParse(email);
		if (!parsedEmail.success) errors.email = parsedEmail.error.issues[0]!.message;
		const password = String(form.get('password') ?? '');
		const parsedPassword = passwordSchema.safeParse(password);
		if (!parsedPassword.success) errors.password = parsedPassword.error.issues[0]!.message;
		else if (parsedEmail.success && password.toLowerCase().includes(parsedEmail.data.split('@')[0]!)) {
			errors.password = 'Your password must not contain your email address.';
		}
		if (form.get('confirmPassword') !== password) errors.confirmPassword = 'The passwords do not match.';
		if (form.get('acceptTerms') !== 'on') errors.acceptTerms = 'You must accept the Terms and Conditions and the Privacy Policy.';
		if (form.get('ageConfirm') !== 'on') errors.ageConfirm = 'You must confirm that you are at least 16 years old.';
		if (Object.keys(errors).length || !parsedEmail.success) return fail(400, { values, errors });

		if (await findUserByEmail(parsedEmail.data)) {
			// Deliberately general, so the form cannot be used to discover registered addresses.
			return fail(400, {
				values,
				errors: { form: 'An account could not be created with these details. If you already have an account, please sign in.' }
			});
		}

		const id = newUserId();
		await (await db()).insert(schema.users).values({ id, email: parsedEmail.data, passwordHash: await hashPassword(password) });
		const codes = await issueRecoveryCodes(id);
		const session = await createSession(id, request.headers.get('user-agent'));
		await logSecurity('account_created', { userId: id, ip, userAgent: request.headers.get('user-agent') });
		setSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:');

		return { created: true, email: parsedEmail.data, codes };
	}
};
