import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { fingerMapCount, requireUser } from '#lib/server/account.ts';
import { clearSessionCookie, verifyPassword } from '#lib/server/auth.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const fm = await fingerMapCount(user.id);
	return { fingerMap: { count: fm.count, updatedAt: fm.updatedAt?.toISOString() ?? null } };
};

export const actions: Actions = {
	delete: async ({ request, locals, url, cookies }) => {
		const user = requireUser(locals, url);
		const form = await request.formData();
		const errors: Record<string, string> = {};
		if (form.get('confirm') !== 'DELETE') errors.confirm = 'Type DELETE in capital letters to confirm.';
		const rows = await (await db()).select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
		if (!rows[0] || !(await verifyPassword(rows[0].hash, String(form.get('password') ?? '')))) {
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
