import { error, redirect } from '@sveltejs/kit';
import { logSecurity } from './security-log.ts';

/**
 * Admins: `role = 'admin'`, read with each session lookup so revocation is immediate; changed only via
 * `npm run admin -w web`. Require TOTP (lib/server/totp.ts), confirmed every MFA_FRESH_MS. Admin pages
 * return 404 to others; signed-out visitors go to sign-in.
 */

/** How long a confirmed code keeps a session's access to the dashboard. */
export const MFA_FRESH_MS = 12 * 60 * 60 * 1000;

const mfaFresh = (locals: App.Locals, now = Date.now()) => !!locals.sessionMfaAt && now - locals.sessionMfaAt.getTime() < MFA_FRESH_MS;

export function requireAdmin(locals: App.Locals, url: URL, opts: { mfa?: boolean } = {}): NonNullable<App.Locals['user']> {
	if (!locals.user) redirect(303, `/signin?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	if (locals.user.role !== 'admin') {
		// Recorded for review: a member reaching for administrator pages.
		void logSecurity('admin_denied', { userId: locals.user.id, detail: url.pathname });
		error(404, 'Not found');
	}
	if (opts.mfa !== false) {
		const next = encodeURIComponent(url.pathname + url.search);
		if (!locals.user.totpEnabledAt) redirect(303, `/admin/2fa/setup?next=${next}`);
		if (!mfaFresh(locals)) redirect(303, `/admin/2fa?next=${next}`);
	}
	return locals.user;
}

/** For API endpoints: 401 without a session, 403 for non-administrators and without a confirmed code. */
export function requireAdminApi(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) error(401, 'Sign in required.');
	if (locals.user.role !== 'admin') {
		void logSecurity('admin_denied', { userId: locals.user.id, detail: 'api' });
		error(403, 'Not allowed.');
	}
	if (!locals.user.totpEnabledAt || !mfaFresh(locals)) error(403, 'Confirm your authenticator code first.');
	return locals.user;
}
