import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/admin.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireAdmin(locals, url);
	redirect(303, '/admin/analytics');
};
