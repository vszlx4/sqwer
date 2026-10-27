import { requireAdmin } from '#lib/server/admin.ts';
import type { LayoutServerLoad } from './$types';

/** Admins only (404 otherwise). Everything except /admin/2fa also needs a confirmed TOTP code. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url, { mfa: !url.pathname.startsWith('/admin/2fa') });
	return {};
};
