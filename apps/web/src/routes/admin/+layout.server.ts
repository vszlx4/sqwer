import { requireAdmin } from '#lib/server/admin.ts';
import type { LayoutServerLoad } from './$types';

/**
 * Every page under /admin is for administrators only; others get 404. Every page except the
 * authenticator set-up and check (/admin/2fa) also needs a confirmed authenticator code.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url, { mfa: !url.pathname.startsWith('/admin/2fa') });
	return {};
};
