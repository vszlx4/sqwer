import { fail, redirect } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { db, schema } from '#lib/server/db/index.ts';
import {
	createSession,
	findUserByEmail,
	hashPassword,
	issueRecoveryCodes,
	newUserId,
	setSessionCookie
} from '#lib/server/auth.ts';
import { guardForm, humanCheck } from '#lib/server/bot/guard.ts';
import { issueTicket } from '#lib/server/bot/ticket.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { ACCEPTANCE_VERSION } from '#lib/site/legal.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import { emailSchema, passwordSchema } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(303, '/account');
	return { human: humanCheck(event, 'signup') };
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, getClientAddress, url } = event;
		const form = await request.formData();
		// Tickets are single-use: every refusal carries a fresh one for the next attempt.
		const again = <T extends Record<string, unknown>>(status: number, data: T) =>
			fail(status, { ...data, ticket: issueTicket('signup', request.headers.get('user-agent')) });
		const email = String(form.get('email') ?? '');
		const values = { email };

		const ip = getClientAddress();
		// Accounts per address, per network and across the whole site, so that automated
		// registration is slow even when spread over many addresses.
		const limits = [
			rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000),
			rateLimit(`signup:net:${networkOf(ip)}`, 20, 60 * 60 * 1000),
			rateLimit('signup:all', 300, 60 * 60 * 1000)
		];
		const blocked = limits.find((l) => !l.ok);
		if (blocked) {
			await logSecurity('rate_limited', { ip, detail: 'signup' });
			return again(429, { values, errors: { form: rateLimitMessage(blocked.retryAfter) } });
		}
		const guard = await guardForm(event, form, 'signup');
		if (!guard.ok) {
			return again(guard.status, { values, challenge: guard.challenge, fallback: guard.fallback, errors: { [guard.field]: guard.message } });
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
		if (Object.keys(errors).length || !parsedEmail.success) return again(400, { values, errors });

		if (await findUserByEmail(parsedEmail.data)) {
			// Deliberately general, so the form cannot be used to discover registered addresses.
			return again(400, {
				values,
				errors: { form: 'An account could not be created with these details. If you already have an account, please sign in.' }
			});
		}

		const id = newUserId();
		const now = new Date();
		// What was accepted, and when, is kept as evidence of acceptance and of the age confirmation.
		await (await db()).insert(schema.users).values({
			id,
			email: parsedEmail.data,
			passwordHash: await hashPassword(password),
			termsVersion: ACCEPTANCE_VERSION,
			termsAcceptedAt: now,
			ageConfirmedAt: now
		});
		const codes = await issueRecoveryCodes(id);
		const session = await createSession(id, request.headers.get('user-agent'));
		await logSecurity('account_created', { userId: id, ip, userAgent: request.headers.get('user-agent') });
		track('signup_completed', { userId: id });
		setSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:');

		return { created: true, email: parsedEmail.data, codes };
	}
};
