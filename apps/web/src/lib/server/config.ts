import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/* Settings from `.env` next to the app; environment wins. SQWER_ENV_FILE=none skips it (tests). */
if (process.env.SQWER_ENV_FILE !== 'none') {
	for (const file of [path.resolve('.env'), path.resolve('apps/web/.env')]) {
		if (!existsSync(file)) continue;
		const before = { ...process.env };
		process.loadEnvFile(file);
		for (const [key, value] of Object.entries(before)) process.env[key] = value;
		// File paths in the .env file are relative to the file itself.
		const ca = process.env.DATABASE_CA_FILE;
		if (ca && !path.isAbsolute(ca)) process.env.DATABASE_CA_FILE = path.join(path.dirname(file), ca);
		break;
	}
}

/** Where local data (embedded database, generated secrets) lives. Never committed. */
export const DATA_DIR = path.resolve(process.env.SQWER_DATA_DIR ?? '.data');

/** Public origin, used for canonical URLs, the sitemap and social previews. */
export const SITE_URL = (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

let cached: Record<string, string> | null = null;

/** Secret from the environment, else generated once and stored in DATA_DIR. */
export function secret(name: string): string {
	const fromEnv = process.env[name];
	if (fromEnv) return fromEnv;

	const file = path.join(DATA_DIR, 'secrets.json');
	if (!cached) {
		mkdirSync(DATA_DIR, { recursive: true });
		cached = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {};
	}
	if (!cached[name]) {
		cached[name] = randomBytes(32).toString('base64url');
		writeFileSync(file, JSON.stringify(cached, null, 2), { mode: 0o600 });
	}
	return cached[name]!;
}
