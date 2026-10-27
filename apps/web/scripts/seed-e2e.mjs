// Seeds e2e accounts: admin, member, lockout target. Test database only.
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { open } from './lib/db.mjs';

if (process.env.SQWER_ENV_FILE !== 'none' || !process.env.SQWER_DATA_DIR || process.env.DATABASE_URL) {
	console.error('seed-e2e only runs against a local test database (SQWER_ENV_FILE=none, SQWER_DATA_DIR set, no DATABASE_URL).');
	process.exit(2);
}

/** The same format as hashPassword in src/lib/server/auth.ts: scrypt$N$r$p$salt$key. */
function hash(password) {
	const salt = randomBytes(16);
	const key = scryptSync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 });
	return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

export const ACCOUNTS = [
	{ email: 'admin@e2e.test', password: 'E2e-admin-pass-2026', role: 'admin' },
	{ email: 'member@e2e.test', password: 'E2e-member-pass-2026', role: 'user' },
	// Locked on purpose by the account enumeration test.
	{ email: 'lockout@e2e.test', password: 'E2e-lockout-pass-2026', role: 'user' },
	// Suspended and restored by the moderation test.
	{ email: 'suspend@e2e.test', password: 'E2e-suspend-pass-2026', role: 'user' },
	// Sends results to the anti-cheat checks.
	{ email: 'player@e2e.test', password: 'E2e-player-pass-2026', role: 'user' }
];

const db = await open({ migrate: true });
try {
	for (const a of ACCOUNTS) {
		await db.query(
			`INSERT INTO users (id, email, password_hash, role, terms_version, terms_accepted_at, age_confirmed_at)
			 VALUES ($1, $2, $3, $4, 'e2e', now(), now()) ON CONFLICT (email) DO NOTHING`,
			[randomUUID(), a.email, hash(a.password), a.role]
		);
	}
} finally {
	await db.close();
}
