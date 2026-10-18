import { LEGAL } from '../site/links.ts';
import { SITE_URL } from './config.ts';

/*
 * Checks at start-up for settings that are fine on a development machine but unsafe on a public
 * site. Problems are written to the server log as structured warnings; values are never printed.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/** Whether PUBLIC_SITE_URL is a public address rather than this machine. */
export function isPublicSite(siteUrl = SITE_URL): boolean {
	try {
		const host = new URL(siteUrl).hostname;
		return !LOCAL_HOSTS.has(host) && !host.endsWith('.localhost');
	} catch {
		return false;
	}
}

const SECRETS = ['CAPTCHA_HMAC_SECRET', 'CAPTCHA_HMAC_KEY_SECRET', 'LOG_HASH_SECRET', 'TOTP_ENCRYPTION_SECRET'] as const;

/** The problems found, as short messages (also used by the tests). */
export function configurationProblems(rawEnv: NodeJS.ProcessEnv = process.env, siteUrl = SITE_URL): string[] {
	if (!isPublicSite(siteUrl)) return [];
	// Read the values as the app does: surrounding spaces (a common .env slip) are ignored.
	const env = Object.fromEntries(Object.entries(rawEnv).map(([k, v]) => [k, v?.trim() || undefined]));
	const problems: string[] = [];
	if (new URL(siteUrl).protocol !== 'https:') {
		problems.push('PUBLIC_SITE_URL is not HTTPS: the session cookie is sent without Secure and HSTS is off.');
	}
	for (const name of SECRETS) {
		const value = env[name];
		if (!value) problems.push(`${name} is not set: a generated value in SQWER_DATA_DIR is used, which is lost if that folder is not persistent.`);
		else if (value.length < 32) problems.push(`${name} is shorter than 32 characters.`);
	}
	if (!env.DATABASE_URL) problems.push('DATABASE_URL is not set: accounts are stored in the embedded database in SQWER_DATA_DIR.');
	if (!!env.TURNSTILE_SITE_KEY !== !!env.TURNSTILE_SECRET_KEY) {
		problems.push('Only one of TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY is set: Turnstile stays off.');
	}
	if (!LEGAL.webHost) problems.push('The web host is not named in the Privacy Policy: set LEGAL.webHost in src/lib/site/links.ts.');
	if (env.TURNSTILE_SECRET_KEY && isTurnstileTestSecret(env.TURNSTILE_SECRET_KEY)) {
		problems.push('TURNSTILE_SECRET_KEY is one of Cloudflare’s test secrets: it is refused on a public site and Turnstile stays off.');
	}
	return problems;
}

/** Cloudflare's published test secrets, which pass (or fail) every token for any site. */
export const isTurnstileTestSecret = (secret: string) => /^[123]x0{30,}AA$/.test(secret);

export function checkConfiguration() {
	for (const warning of configurationProblems()) console.warn(JSON.stringify({ kind: 'config', warning }));
}
