// Database access for command-line scripts, connected the same way as the app (src/lib/server/db):
// DATABASE_URL (with DATABASE_CA_FILE) when set, otherwise the embedded database in SQWER_DATA_DIR.
// Settings are read from the .env file like the app, unless SQWER_ENV_FILE=none.
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadEnv() {
	if (process.env.SQWER_ENV_FILE === 'none') return;
	const file = path.join(APP_DIR, '.env');
	if (!existsSync(file)) return;
	const before = { ...process.env };
	process.loadEnvFile(file);
	Object.assign(process.env, before);
	const ca = process.env.DATABASE_CA_FILE;
	if (ca && !path.isAbsolute(ca)) process.env.DATABASE_CA_FILE = path.join(APP_DIR, ca);
}

/**
 * Opens the database. Returns `query(text, params)` and `close()`. With `migrate: true`, pending
 * migrations are applied (this needs the owner role); otherwise the schema must already be up to date.
 * `url` overrides DATABASE_URL, for example with MIGRATION_DATABASE_URL.
 */
export async function open({ migrate: apply = false, url: override } = {}) {
	loadEnv();
	const url = (override ?? process.env.DATABASE_URL)?.trim();
	let query, close, transaction;
	if (url) {
		const { default: pg } = await import('pg');
		const host = new URL(url).hostname;
		const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
		const caFile = process.env.DATABASE_CA_FILE?.trim();
		const ssl = local ? false : { rejectUnauthorized: true, ...(caFile ? { ca: readFileSync(caFile, 'utf8') } : {}) };
		const pool = new pg.Pool({ connectionString: url, max: 1, ssl });
		query = async (text, params = []) => (await pool.query(text, params)).rows;
		transaction = async (fn) => {
			const client = await pool.connect();
			try {
				await client.query('BEGIN');
				await fn(async (text, params = []) => (await client.query(text, params)).rows);
				await client.query('COMMIT');
			} catch (e) {
				await client.query('ROLLBACK');
				throw e;
			} finally {
				client.release();
			}
		};
		close = () => pool.end();
	} else {
		const { PGlite } = await import('@electric-sql/pglite');
		const dir = path.join(path.resolve(APP_DIR, process.env.SQWER_DATA_DIR ?? '.data'), 'pglite');
		mkdirSync(dir, { recursive: true });
		const db = new PGlite(dir);
		query = async (text, params = []) => (await db.query(text, params)).rows;
		transaction = (fn) => db.transaction((tx) => fn(async (text, params = []) => (await tx.query(text, params)).rows));
		close = () => db.close();
	}
	const applied = await migrate(query, transaction, apply);
	return { query, close, applied };
}

/** Read-only check first, as in the app (src/lib/server/db/index.ts); returns the migrations applied. */
async function migrate(query, transaction, apply) {
	const [{ present }] = await query("SELECT to_regclass('public.sqwer_migrations') IS NOT NULL AS present");
	const done = new Set(present ? (await query('SELECT name FROM sqwer_migrations')).map((r) => r.name) : []);
	const dir = path.join(APP_DIR, 'drizzle');
	const pending = readdirSync(dir)
		.filter((f) => f.endsWith('.sql') && !done.has(f))
		.sort();
	if (!pending.length) return [];
	// The embedded database is only ever used by this app, so it is kept up to date automatically.
	if (!apply && process.env.DATABASE_URL) {
		throw new Error(`The database schema is out of date (${pending.length} pending). Run \`npm run db:migrate -w web\` first.`);
	}
	if (!present) {
		await query('CREATE TABLE IF NOT EXISTS sqwer_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
		await query('ALTER TABLE sqwer_migrations ENABLE ROW LEVEL SECURITY');
	}
	for (const name of pending) {
		const statements = readFileSync(path.join(dir, name), 'utf8')
			.split('--> statement-breakpoint')
			.map((s) => s.trim())
			.filter(Boolean);
		await transaction(async (tx) => {
			for (const statement of statements) await tx(statement);
			await tx('INSERT INTO sqwer_migrations (name) VALUES ($1)', [name]);
		});
	}
	return pending;
}

/**
 * Lets the restricted application role read and write rows, and nothing else: no schema changes.
 * Every table has row-level security enabled without policies (so Supabase's public API roles see
 * nothing); this adds one policy per table for the application role only. Safe to run repeatedly,
 * and run after each migration so that new tables are covered.
 */
export async function grantAppRole(query, role) {
	if (!/^[a-z_][a-z0-9_]{0,62}$/.test(role)) throw new Error('DATABASE_APP_ROLE must be a plain lower-case role name.');
	const r = `"${role}"`;
	await query(`GRANT USAGE ON SCHEMA public TO ${r}`);
	await query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${r}`);
	await query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${r}`);
	const tables = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
	const covered = [];
	for (const { tablename } of tables) {
		if (!/^[a-z_][a-z0-9_]*$/.test(tablename)) continue;
		const [{ present }] = await query(
			"SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = $1 AND policyname = 'sqwer_app_access') AS present",
			[tablename]
		);
		if (!present) await query(`CREATE POLICY sqwer_app_access ON public."${tablename}" FOR ALL TO ${r} USING (true) WITH CHECK (true)`);
		covered.push(tablename);
	}
	return covered;
}

