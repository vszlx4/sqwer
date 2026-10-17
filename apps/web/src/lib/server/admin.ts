import { error, redirect } from '@sveltejs/kit';
import { logSecurity } from './security-log.ts';

/**
 * Administrators: users whose `role` is 'admin' in the database. The role is read from the
 * database with every request (it is part of the session lookup), so revoking it takes effect at
 * once. It can only be changed from the server's command line (`npm run admin -w web`).
 *
 * Pages for administrators answer 404 to everyone else, so their existence is not revealed;
 * visitors who are not signed in are sent to sign in first.
 */
export function requireAdmin(locals: App.Locals, url: URL): NonNullable<App.Locals['user']> {
	if (!locals.user) redirect(303, `/signin?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
	if (locals.user.role !== 'admin') {
		// Recorded for review: a member reaching for administrator pages.
		void logSecurity('admin_denied', { userId: locals.user.id, detail: url.pathname });
		error(404, 'Not found');
	}
	return locals.user;
}

/** For API endpoints: 401 without a session, 403 for signed-in users who are not administrators. */
export function requireAdminApi(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) error(401, 'Sign in required.');
	if (locals.user.role !== 'admin') {
		void logSecurity('admin_denied', { userId: locals.user.id, detail: 'api' });
		error(403, 'Not allowed.');
	}
	return locals.user;
}
