import { fail, redirect } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { eq } from 'drizzle-orm';
import { logSecurity } from '#lib/server/security-log.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { createSession, dummyPasswordHash, findUserByEmail, setSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { guardForm, humanCheck } from '#lib/server/bot/guard.ts';
import { issueTicket } from '#lib/server/bot/ticket.ts';
import { networkOf, recordAbuse } from '#lib/server/bot/risk.ts';
import { failureLimit, rateLimit, rateLimitMessage, recordFailure } from '#lib/server/rate-limit.ts';
import { emailSchema, safeRedirect } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

const INVALID = 'The email address or password is incorrect.';
/**
 * Failed attempts allowed for one account from one address, and for one account from all
 * addresses together, within LOCK_MS. The first stops guessing from one place; the second stops
 * credential stuffing spread over many addresses, while the account itself is only locked after
 * ACCOUNT_LOCK_AFTER consecutive failures, so a stranger cannot keep someone locked out cheaply.
 */
const MAX_FAILURES = 5;
const MAX_FAILURES_ALL_ADDRESSES = 30;
const ACCOUNT_LOCK_AFTER = 10;
const LOCK_MS = 15 * 60 * 1000;

export const load: PageServerLoad = async (event) => {
	const { locals, url } = event;
	if (locals.user) redirect(303, safeRedirect(url.searchParams.get('redirectTo'), '/account'));
	return {
		human: humanCheck(event, 'signin'),
		notice:
			url.searchParams.get('deleted') === '1'
				? 'Your account and its data have been deleted.'
				: url.searchParams.get('signedOut') === '1'
					? 'You have been signed out.'
					: null
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, getClientAddress, url } = event;
		const form = await request.formData();
		// Tickets are single-use: every refusal carries a fresh one for the next attempt.
		const again = <T extends Record<string, unknown>>(status: number, data: T) =>
			fail(status, { ...data, ticket: issueTicket('signin', request.headers.get('user-agent')) });
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const values = { email };

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent');
		// The per-email failure limit applies whether or not the account exists, so it reveals nothing.
		const emailKey = `signin:email:${email}:${ip}`;
		const emailAllKey = `signin:email:${email}`;
		const ipLimit = rateLimit(`signin:ip:${ip}`, 20, LOCK_MS);
		const netLimit = rateLimit(`signin:net:${networkOf(ip)}`, 100, LOCK_MS);
		const emailLimit = failureLimit(emailKey, MAX_FAILURES, LOCK_MS);
		const emailAllLimit = failureLimit(emailAllKey, MAX_FAILURES_ALL_ADDRESSES, LOCK_MS);
		if (!ipLimit.ok || !netLimit.ok || !emailLimit.ok || !emailAllLimit.ok) {
			await logSecurity('rate_limited', { ip, detail: 'signin' });
			const wait = Math.max(ipLimit.retryAfter, netLimit.retryAfter, emailLimit.retryAfter, emailAllLimit.retryAfter);
			track('signin_failed', { props: { reason: 'rate_limited' } });
			return again(429, { values, errors: { form: rateLimitMessage(wait) } });
		}
		const guard = await guardForm(event, form, 'signin');
		if (!guard.ok) {
			track('signin_failed', { props: { reason: guard.field === 'form' ? 'blocked' : 'verification' } });
			return again(guard.status, { values, challenge: guard.challenge, fallback: guard.fallback, errors: { [guard.field]: guard.message } });
		}
		const password = String(form.get('password') ?? '');
		if (!emailSchema.safeParse(email).success || !password) {
			recordFailure(emailKey);
			recordFailure(emailAllKey);
			recordAbuse(ip, 'signin');
			track('signin_failed', { props: { reason: 'credentials' } });
			return again(400, { values, challenge: true, errors: { form: INVALID } });
		}

		const user = await findUserByEmail(email);
		// Hash even when the account does not exist so timing does not reveal it.
		const ok = await verifyPassword(user?.passwordHash ?? (await dummyPasswordHash()), password);
		const d = await db();

		if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
			await logSecurity('sign_in_failed', { userId: user.id, ip, userAgent, detail: 'locked' });
			track('signin_failed', { props: { reason: 'locked' } });
			return again(429, { values, errors: { form: rateLimitMessage((user.lockedUntil.getTime() - Date.now()) / 1000) } });
		}
		if (!user || !ok) {
			recordFailure(emailKey);
			recordFailure(emailAllKey);
			recordAbuse(ip, 'signin');
			if (user) {
				const failures = user.failedLogins + 1;
				const lock = failures >= ACCOUNT_LOCK_AFTER;
				await d
					.update(schema.users)
					.set({ failedLogins: lock ? 0 : failures, lockedUntil: lock ? new Date(Date.now() + LOCK_MS) : null })
					.where(eq(schema.users.id, user.id));
				await logSecurity(lock ? 'account_locked' : 'sign_in_failed', { userId: user.id, ip, userAgent });
			}
			track('signin_failed', { props: { reason: 'credentials' } });
			// After a failure the next attempt from this address is asked to verify.
			return again(400, { values, challenge: true, errors: { form: INVALID } });
		}

		await d.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
		await logSecurity('signed_in', { userId: user.id, ip, userAgent });
		track('signin_succeeded', { userId: user.id });
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
