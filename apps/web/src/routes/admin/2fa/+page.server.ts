import { fail, redirect } from '@sveltejs/kit';
import { MFA_FRESH_MS, requireAdmin } from '#lib/server/admin.ts';
import { verifyAdminCode } from '#lib/server/mfa.ts';
import { safeRedirect } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

/** The authenticator check each administrator session passes before the dashboard opens. */
const destination = (url: URL) => {
	const next = safeRedirect(url.searchParams.get('next'), '/admin/analytics');
	return next.startsWith('/admin') && !next.startsWith('/admin/2fa') ? next : '/admin/analytics';
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireAdmin(locals, url, { mfa: false });
	if (!user.totpEnabledAt) redirect(303, `/admin/2fa/setup?next=${encodeURIComponent(destination(url))}`);
	if (locals.sessionMfaAt && Date.now() - locals.sessionMfaAt.getTime() < MFA_FRESH_MS) redirect(303, destination(url));
	return {};
};

export const actions: Actions = {
	default: async ({ locals, url, request }) => {
		const user = requireAdmin(locals, url, { mfa: false });
		const code = String((await request.formData()).get('code') ?? '');
		const outcome = await verifyAdminCode(user.id, locals.sessionId, code);
		if (outcome === 'limited') return fail(429, { error: 'Too many attempts. Please wait 15 minutes and try again.' });
		if (outcome === 'invalid') return fail(400, { error: 'That code is not valid. Enter the current six-digit code from your authenticator app.' });
		redirect(303, destination(url));
	}
};
