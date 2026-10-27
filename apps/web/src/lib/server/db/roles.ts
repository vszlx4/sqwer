/*
 * Restricted app role (DATABASE_APP_ROLE, default `sqwer_app`): row read/write only. No DDL, no RLS bypass,
 * no roles, no migration record writes. Shared with scripts/lib/db.mjs, so no path aliases.
 */

export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export const DEFAULT_APP_ROLE = 'sqwer_app';

/** The configured role, or null when switched off (DATABASE_APP_ROLE=none). */
export function appRoleName(env: Record<string, string | undefined> = process.env): string | null {
	const role = (env.DATABASE_APP_ROLE ?? DEFAULT_APP_ROLE).trim();
	if (!role || role === 'none') return null;
	if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('DATABASE_APP_ROLE must be a plain lower-case role name.');
	return role;
}

/** Whether the connected user may manage the schema (superuser, or owner of the application tables). */
export async function canManageSchema(query: Query): Promise<boolean> {
	const [row] = await query(`SELECT r.rolsuper OR EXISTS (
			SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users' AND tableowner = current_user
		) AS manage FROM pg_roles r WHERE r.rolname = current_user`);
	return row?.manage === true;
}

/**
 * Row access for the role only. RLS is on for every table without general policies (Supabase API roles see
 * nothing); one policy per table for this role, read-only on migrations. Idempotent; runs after every migration.
 */
export async function grantAppRole(query: Query, role: string): Promise<string[]> {
	if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('DATABASE_APP_ROLE must be a plain lower-case role name.');
	const r = `"${role}"`;
	await query(`GRANT USAGE ON SCHEMA public TO ${r}`);
	await query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${r}`);
	await query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${r}`);
	// The record of applied migrations is only read by the app, never changed by it.
	await query(`REVOKE INSERT, UPDATE, DELETE ON public.sqwer_migrations FROM ${r}`);
	const tables = await query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
	const covered: string[] = [];
	for (const { tablename, rowsecurity } of tables) {
		const name = String(tablename);
		if (!/^[a-z_][a-z0-9_]*$/.test(name)) continue;
		// Every table keeps row-level security on, so Supabase's public API roles can never read it.
		if (rowsecurity !== true) await query(`ALTER TABLE public."${name}" ENABLE ROW LEVEL SECURITY`);
		const [{ present } = { present: false }] = await query(
			"SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = $1 AND policyname = 'sqwer_app_access') AS present",
			[name]
		);
		const command = name === 'sqwer_migrations' ? 'SELECT' : 'ALL';
		const check = command === 'ALL' ? ' WITH CHECK (true)' : '';
		if (!present) await query(`CREATE POLICY sqwer_app_access ON public."${name}" FOR ${command} TO ${r} USING (true)${check}`);
		covered.push(name);
	}
	return covered;
}

/**
 * Creates the role (NOLOGIN, reached via SET ROLE), allows the connecting user to switch to it, grants row access.
 */
export async function ensureAppRole(query: Query, role: string): Promise<void> {
	if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('DATABASE_APP_ROLE must be a plain lower-case role name.');
	const [{ exists } = { exists: false }] = await query('SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists', [role]);
	if (!exists) await query(`CREATE ROLE "${role}" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
	// PostgreSQL 16+ separates membership from the right to SET ROLE (Supabase's creator gets ADMIN only).
	const canSet = async () => {
		const sql = (privilege: string) => `SELECT r.rolsuper OR pg_has_role(current_user, $1, '${privilege}') AS ok FROM pg_roles r WHERE r.rolname = current_user`;
		const [row] = await query(sql('SET'), [role]).catch(() => query(sql('MEMBER'), [role]));
		return row?.ok === true;
	};
	if (!(await canSet())) {
		await query(`GRANT "${role}" TO CURRENT_USER WITH SET TRUE, INHERIT FALSE`).catch(() => query(`GRANT "${role}" TO CURRENT_USER`));
	}
	await grantAppRole(query, role);
}
