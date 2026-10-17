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

/** Opens the database and applies pending migrations. Returns `query(text, params)` and `close()`. */
export async function open() {
	loadEnv();
	const url = process.env.DATABASE_URL?.trim();
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
	await migrate(query, transaction);
	return { query, close };
}

async function migrate(query, transaction) {
	await query('CREATE TABLE IF NOT EXISTS sqwer_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
	await query('ALTER TABLE sqwer_migrations ENABLE ROW LEVEL SECURITY');
	const done = new Set((await query('SELECT name FROM sqwer_migrations')).map((r) => r.name));
	const dir = path.join(APP_DIR, 'drizzle');
	for (const name of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
		if (done.has(name)) continue;
		const statements = readFileSync(path.join(dir, name), 'utf8')
			.split('--> statement-breakpoint')
			.map((s) => s.trim())
			.filter(Boolean);
		await transaction(async (tx) => {
			for (const statement of statements) await tx(statement);
			await tx('INSERT INTO sqwer_migrations (name) VALUES ($1)', [name]);
		});
	}
}
