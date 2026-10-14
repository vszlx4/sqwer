import { redirect } from '@sveltejs/kit';
import { clearSessionCookie, deleteSession } from '#lib/server/auth.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => redirect(303, '/');

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.sessionId) await deleteSession(locals.sessionId);
		if (locals.user) await logSecurity('signed_out', { userId: locals.user.id });
		clearSessionCookie(cookies);
		redirect(303, '/signin?signedOut=1');
	}
};
