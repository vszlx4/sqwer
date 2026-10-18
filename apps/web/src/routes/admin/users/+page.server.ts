import { fail } from '@sveltejs/kit';
import { eq, or } from 'drizzle-orm';
import { requireAdmin } from '#lib/server/admin.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { suspendUser, unsuspendUser } from '#lib/server/moderation.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { logSecurity } from '#lib/server/security-log.ts';
import type { Actions, PageServerLoad } from './$types';

/*
 * Moderation for administrators: find one account by its exact email address or username (no list of
 * everyone is offered), and suspend it or lift a suspension. Administrators are suspended only from
 * the server's command line, so the dashboard can never lock out the people who run it.
 */

async function find(query: string) {
	const q = query.trim().toLowerCase().replace(/^@/, '');
	if (!q || q.length > 254) return null;
	const [row] = await (await db())
		.select({
			id: schema.users.id,
			email: schema.users.email,
			role: schema.users.role,
			createdAt: schema.users.createdAt,
			suspendedAt: schema.users.suspendedAt,
			suspendedReason: schema.users.suspendedReason,
			username: schema.profiles.username,
			displayName: schema.profiles.displayName
		})
		.from(schema.users)
		.leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
		.where(or(eq(schema.users.email, q), eq(schema.profiles.username, q)))
		.limit(1);
	return row ?? null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const admin = requireAdmin(locals, url);
	const q = url.searchParams.get('q') ?? '';
	if (!q) return { q, account: null, searched: false };
	if (!rateLimit(`admin-search:${admin.id}`, 120, 60 * 60 * 1000).ok) return { q, account: null, searched: true, limited: true };
	const row = await find(q);
	return {
		q,
		searched: true,
		account: row
			? {
					email: row.email,
					username: row.username,
					displayName: row.displayName,
					admin: row.role === 'admin',
					createdAt: row.createdAt.toISOString(),
					suspendedAt: row.suspendedAt?.toISOString() ?? null,
					suspendedReason: row.suspendedReason
				}
			: null
	};
};

export const actions: Actions = {
	suspend: async ({ locals, url, request }) => {
		const admin = requireAdmin(locals, url);
		const form = await request.formData();
		const target = await find(String(form.get('email') ?? ''));
		const reason = String(form.get('reason') ?? '').trim();
		if (!target) return fail(404, { error: 'No account matches.' });
		if (target.role === 'admin' || target.id === admin.id) return fail(400, { error: 'Administrators can only be suspended from the server.' });
		if (reason.length < 3 || reason.length > 500) return fail(400, { error: 'Give a reason of 3 to 500 characters.' });
		await suspendUser(target.id, reason, admin.id);
		await logSecurity('admin_action', { userId: admin.id, detail: `suspend:${target.id}` });
		return { done: `${target.email} is suspended and signed out everywhere.` };
	},
	unsuspend: async ({ locals, url, request }) => {
		const admin = requireAdmin(locals, url);
		const target = await find(String((await request.formData()).get('email') ?? ''));
		if (!target) return fail(404, { error: 'No account matches.' });
		await unsuspendUser(target.id, admin.id);
		await logSecurity('admin_action', { userId: admin.id, detail: `unsuspend:${target.id}` });
		return { done: `${target.email} is no longer suspended.` };
	}
};
