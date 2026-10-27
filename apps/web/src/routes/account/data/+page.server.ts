import { fail, redirect } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { eq } from 'drizzle-orm';
import { DATA_CATEGORY_IDS, type DataCategory } from '#lib/data/categories.ts';
import { clearCategory, dataCounts } from '#lib/server/data.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { fingerMapCount, requireUser } from '#lib/server/account.ts';
import { clearSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import { invalidateLeaderboards } from '#lib/server/progress.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const [fm, counts] = await Promise.all([fingerMapCount(user.id), dataCounts(user.id)]);
	return { fingerMap: { count: fm.count, updatedAt: fm.updatedAt?.toISOString() ?? null }, counts };
};

/** Password check before destructive actions, rate-limited per account. */
async function passwordMatches(userId: string, password: string): Promise<boolean | 'limited'> {
	if (!rateLimit(`password-check:${userId}`, 10, 60 * 60 * 1000).ok) return 'limited';
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
		const match = await passwordMatches(user.id, String(form.get('password') ?? ''));
		if (match !== true) {
			return fail(match === 'limited' ? 429 : 400, { category, errors: { password: match === 'limited' ? 'Too many attempts. Please try again later.' : 'The password is incorrect.' } });
		}
		const at = await clearCategory(user.id, category);
		await logSecurity('data_cleared', { userId: user.id, detail: category });
		track('data_cleared', { userId: user.id, props: { category } });
		return { cleared: category, at: at.getTime() };
	},
	delete: async ({ request, locals, url, cookies }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const errors: Record<string, string> = {};
		if (form.get('confirm') !== 'DELETE') errors.confirm = 'Type DELETE in capital letters to confirm.';
		const match = await passwordMatches(user.id, String(form.get('password') ?? ''));
		if (match !== true) errors.password = match === 'limited' ? 'Too many attempts. Please try again later.' : 'The password is incorrect.';
		if (Object.keys(errors).length) return fail(400, { errors });

		// Profile, sessions, recovery codes and the finger map are removed by cascade.
		await (await db()).delete(schema.users).where(eq(schema.users.id, user.id));
		invalidateLeaderboards();
		await logSecurity('account_deleted', { detail: user.id });
		// Recorded without the account, which no longer exists.
		track('account_deleted');
		clearSessionCookie(cookies);
		redirect(303, '/signin?deleted=1');
	}
};
