import { requireAdmin } from '#lib/server/admin.ts';
import type { LayoutServerLoad } from './$types';

/** Every page under /admin is for administrators only; others get 404. */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url);
	return {};
};
