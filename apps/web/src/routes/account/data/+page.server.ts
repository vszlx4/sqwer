import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { DATA_CATEGORY_IDS, type DataCategory } from '#lib/data/categories.ts';
import { clearCategory, dataCounts } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { fingerMapCount, requireUser } from '#lib/server/account.ts';
import { clearSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const [fm, counts] = await Promise.all([fingerMapCount(user.id), dataCounts(user.id)]);
	return { fingerMap: { count: fm.count, updatedAt: fm.updatedAt?.toISOString() ?? null }, counts };
};

async function passwordMatches(userId: string, password: string): Promise<boolean> {
	const rows = await (await db()).select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
	return !!rows[0] && (await verifyPassword(rows[0].hash, password));
}

export const actions: Actions = {
	/** Clears one category of data and leaves every other category as it is. */
	clear: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const category = String(form.get('category') ?? '') as DataCategory;
		if (!DATA_CATEGORY_IDS.includes(category)) return fail(400, { category, errors: { password: 'Choose what to clear.' } });
		if (!(await passwordMatches(user.id, String(form.get('password') ?? '')))) {
			return fail(400, { category, errors: { password: 'The password is incorrect.' } });
		}
		const at = await clearCategory(user.id, category);
		await logSecurity('data_cleared', { userId: user.id, detail: category });
		return { cleared: category, at: at.getTime() };
	},
	delete: async ({ request, locals, url, cookies }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const errors: Record<string, string> = {};
		if (form.get('confirm') !== 'DELETE') errors.confirm = 'Type DELETE in capital letters to confirm.';
		if (!(await passwordMatches(user.id, String(form.get('password') ?? '')))) {
			errors.password = 'The password is incorrect.';
		}
		if (Object.keys(errors).length) return fail(400, { errors });

		// Profile, sessions, recovery codes and the finger map are removed by cascade.
		await (await db()).delete(schema.users).where(eq(schema.users.id, user.id));
		await logSecurity('account_deleted', { detail: user.id });
		clearSessionCookie(cookies);
		redirect(303, '/signin?deleted=1');
	}
};
