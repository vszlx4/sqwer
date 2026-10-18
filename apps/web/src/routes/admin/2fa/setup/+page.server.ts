import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/admin.ts';
import { confirmSetup, startSetup } from '#lib/server/mfa.ts';
import { groupSecret, otpauthUri, qrDataUrl } from '#lib/server/totp.ts';
import { safeRedirect } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

/** Setting up the authenticator app every administrator needs. */
const destination = (url: URL) => {
	const next = safeRedirect(url.searchParams.get('next'), '/admin/analytics');
	return next.startsWith('/admin') && !next.startsWith('/admin/2fa') ? next : '/admin/analytics';
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireAdmin(locals, url, { mfa: false });
	// Once set up, it is only removed from the server (reset-2fa), never replaced from a session.
	if (user.totpEnabledAt) redirect(303, `/admin/2fa?next=${encodeURIComponent(destination(url))}`);
	return {};
};

export const actions: Actions = {
	/** The password again, then a new secret to scan. */
	start: async ({ locals, url, request }) => {
		const user = requireAdmin(locals, url, { mfa: false });
		if (user.totpEnabledAt) return fail(400, { step: 'start', error: 'An authenticator app is already set up.' });
		const outcome = await startSetup(user.id, String((await request.formData()).get('password') ?? ''));
		if (outcome === 'limited') return fail(429, { step: 'start', error: 'Too many attempts. Please wait 15 minutes and try again.' });
		if (outcome === 'invalid') return fail(400, { step: 'start', error: 'The password is incorrect.' });
		const uri = otpauthUri(outcome.secret, user.email);
		return { step: 'scan', qr: qrDataUrl(uri), secret: groupSecret(outcome.secret) };
	},
	/** A code from the app confirms it. */
	confirm: async ({ locals, url, request }) => {
		const user = requireAdmin(locals, url, { mfa: false });
		const outcome = await confirmSetup(user.id, locals.sessionId, String((await request.formData()).get('code') ?? ''));
		if (outcome === 'limited') return fail(429, { step: 'scan', error: 'Too many attempts. Please wait 15 minutes and try again.' });
		if (outcome === 'invalid') return fail(400, { step: 'scan', error: 'That code is not valid. Check the time on your phone and enter the current code.' });
		redirect(303, destination(url));
	}
};
