import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Where local data (embedded database, generated secrets) lives. Never committed. */
export const DATA_DIR = path.resolve(process.env.SQWER_DATA_DIR ?? '.data');

/** Public origin, used for canonical URLs, the sitemap and social previews. */
export const SITE_URL = (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

let cached: Record<string, string> | null = null;

/**
 * Reads a secret from the environment. When it is not set, a random value is
 * generated once and stored in DATA_DIR so it survives restarts.
 */
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
