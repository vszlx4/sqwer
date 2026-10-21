import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { afterEach, describe, expect, it } from 'vitest';
import { activeSessions, createSession, deleteExpiredSessions, validateSession } from './auth.ts';
import { turnstileConfig } from './bot/turnstile.ts';
import { configurationProblems, isPublicSite } from './config-check.ts';
import { db, migrate, schema, type Database } from './db/index.ts';
import { grantAppRole } from './db/roles.ts';
import { isWeakPassword, passwordSchema } from './validation.ts';

describe('password blocklist', () => {
	it('refuses common, repeated and sequential passwords', () => {
		for (const p of ['1234567890', 'Password123', 'qwertyuiop', 'QWERTY UIOP', 'aaaaaaaaaaaa', 'ababababab', '9876543210', 'abcdefghijk', 'zyxwvutsrq']) {
			expect(isWeakPassword(p), p).toBe(true);
			expect(passwordSchema.safeParse(p).success, p).toBe(false);
		}
	});

	it('accepts ordinary long passwords', () => {
		for (const p of ['correct-horse-battery', 'another-long-passphrase', 'Tea at 4 by the lake']) {
			expect(passwordSchema.safeParse(p).success, p).toBe(true);
		}
	});
});

describe('production configuration check', () => {
	const good = {
		CAPTCHA_HMAC_SECRET: 'x'.repeat(40),
		CAPTCHA_HMAC_KEY_SECRET: 'y'.repeat(40),
		LOG_HASH_SECRET: 'z'.repeat(40),
		TOTP_ENCRYPTION_SECRET: 'w'.repeat(40),
		DATABASE_URL: 'postgresql://app@db.example/sqwer'
	};

	it('stays quiet on this machine and for a complete public configuration', () => {
		expect(isPublicSite('http://localhost:3000')).toBe(false);
		expect(configurationProblems({}, 'http://localhost:3000')).toEqual([]);
		// Until the web host is named in the Privacy Policy, that is the only remaining problem.
		expect(configurationProblems(good, 'https://sqwer.example').filter((p) => !p.includes('web host'))).toEqual([]);
	});

	it('reports what is unsafe on a public site', () => {
		const problems = configurationProblems({ ...good, LOG_HASH_SECRET: 'short', TURNSTILE_SITE_KEY: 'k', TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' }, 'http://sqwer.example');
		expect(problems.join('\n')).toMatch(/not HTTPS/);
		expect(problems.join('\n')).toMatch(/LOG_HASH_SECRET is shorter/);
		expect(problems.join('\n')).toMatch(/test secrets/);
		expect(configurationProblems({}, 'https://sqwer.example').filter((p) => p.includes('is not set'))).toHaveLength(5);
		// Values are read as the app reads them, without surrounding spaces.
		expect(configurationProblems({ ...good, TURNSTILE_SITE_KEY: 'k', TURNSTILE_SECRET_KEY: ' 1x0000000000000000000000000000000AA ' }, 'https://sqwer.example').join()).toMatch(/test secrets/);
		expect(configurationProblems({ ...good, TURNSTILE_SITE_KEY: ' ', TURNSTILE_SECRET_KEY: 'secret' }, 'https://sqwer.example').join()).toMatch(/Only one/);
	});
});

describe('Turnstile test secrets', () => {
	afterEach(() => {
		delete process.env.TURNSTILE_SITE_KEY;
		delete process.env.TURNSTILE_SECRET_KEY;
	});

	it('are refused on a public site, where they would pass every token', () => {
		// The unit tests run with PUBLIC_SITE_URL=https://sqwer.example.
		process.env.TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
		process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
		expect(turnstileConfig()).toBeNull();
		process.env.TURNSTILE_SECRET_KEY = 'a-real-looking-secret-key-from-cloudflare';
		expect(turnstileConfig()).not.toBeNull();
	});
});

describe('session lifetime', () => {
	it('ends a session 90 days after sign-in, however active it is', async () => {
		const d = await db();
		const userId = randomUUID();
		await d.insert(schema.users).values({ id: userId, email: `${userId}@example.com`, passwordHash: 'x' });
		const { token, id } = await createSession(userId, null);
		expect(await validateSession(token)).not.toBeNull();
		// Still within its sliding expiry, but signed in 91 days ago.
		await d.update(schema.sessions).set({ createdAt: new Date(Date.now() - 91 * 864e5) }).where(eq(schema.sessions.id, id));
		expect(await validateSession(token)).toBeNull();
		expect(await d.select().from(schema.sessions).where(eq(schema.sessions.id, id))).toHaveLength(0);
		// A session past the cap whose sliding expiry is still ahead is neither listed nor kept.
		const second = await createSession(userId, null);
		await d.update(schema.sessions).set({ createdAt: new Date(Date.now() - 100 * 864e5) }).where(eq(schema.sessions.id, second.id));
		expect(await activeSessions(userId)).toHaveLength(0);
		await deleteExpiredSessions();
		expect(await d.select().from(schema.sessions).where(eq(schema.sessions.id, second.id))).toHaveLength(0);
	});
});

describe('migrations under a restricted database role', () => {
	it('start normally when the schema is up to date, without changing it', async () => {
		const pg = new PGlite();
		const owner = drizzle(pg, { schema }) as unknown as Database;
		await migrate(owner);
		// The role docs/operations/DEPLOYMENT.md recommends for the running app: rows only, no schema changes.
		await pg.exec('CREATE ROLE sqwer_app NOLOGIN; CREATE ROLE anon NOLOGIN; REVOKE ALL ON SCHEMA public FROM PUBLIC;');
		const query = async (text: string, params: unknown[] = []) => (await pg.query<Record<string, unknown>>(text, params)).rows;
		expect((await grantAppRole(query, 'sqwer_app')).length).toBeGreaterThan(15);
		// Running it again changes nothing.
		await grantAppRole(query, 'sqwer_app');
		await expect(grantAppRole(query, 'x; drop table users')).rejects.toThrow();
		await pg.exec(`GRANT USAGE ON SCHEMA public TO anon; GRANT SELECT ON users TO anon;`);
		await pg.exec(`INSERT INTO users (id, email, password_hash) VALUES ('u1', 'u1@example.com', 'x')`);

		await pg.exec('SET ROLE sqwer_app');
		await expect(migrate(owner)).resolves.toBeUndefined();
		// The app role reads and writes rows...
		expect((await pg.query('SELECT id FROM users')).rows).toHaveLength(1);
		await pg.exec(`UPDATE users SET failed_logins = 1 WHERE id = 'u1'`);
		// ...but cannot change the record of applied migrations.
		await expect(pg.exec(`DELETE FROM sqwer_migrations`)).rejects.toThrow(/permission denied/);
		await expect(pg.exec(`INSERT INTO sqwer_migrations (name) VALUES ('fake.sql')`)).rejects.toThrow(/permission denied/);
		// And the role really cannot change the schema.
		await expect(pg.exec('CREATE TABLE intruder (id int)')).rejects.toThrow(/permission denied/);
		const rows = (await owner.execute(sql`select count(*)::int as n from sqwer_migrations`)) as unknown as { rows: { n: number }[] };
		expect(rows.rows[0]!.n).toBeGreaterThan(10);
		// A role with a grant but no policy (like Supabase's public API roles) still sees no rows.
		await pg.exec('RESET ROLE; SET ROLE anon');
		expect((await pg.query('SELECT id FROM users')).rows).toHaveLength(0);
		await pg.close();
	});
});

describe('the application connection', () => {
	it('serves requests as the restricted role, which cannot change the schema', async () => {
		const d = await db();
		const rows = (q: ReturnType<typeof sql>) => d.execute(q).then((r) => (r as unknown as { rows: Record<string, unknown>[] }).rows);
		expect((await rows(sql`select current_user as name`))[0]!.name).toBe('sqwer_app');
		await expect(d.execute(sql`create table intruder (id int)`)).rejects.toThrow();
		await expect(d.execute(sql`drop table users`)).rejects.toThrow();
		await expect(d.execute(sql`delete from sqwer_migrations`)).rejects.toThrow();
	});
});

describe('row-level security', () => {
	it('is enabled on every table', async () => {
		const d = await db();
		const res = (await d.execute(sql`select tablename from pg_tables where schemaname = 'public' and not rowsecurity`)) as unknown as { rows: unknown[] };
		const all = (await d.execute(sql`select count(*)::int as n from pg_tables where schemaname = 'public'`)) as unknown as { rows: { n: number }[] };
		expect(all.rows[0]!.n).toBeGreaterThanOrEqual(18);
		expect(res.rows).toEqual([]);
	});
});
