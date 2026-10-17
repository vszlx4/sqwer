import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, isNull, lt, ne, or } from 'drizzle-orm';
import { db, schema } from './db/index.ts';

const { users, sessions, recoveryCodes } = schema;

// ---------------------------------------------------------------- passwords

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
	return new Promise((resolve, reject) =>
		scryptCb(password.normalize('NFKC'), salt, keylen, { ...opts, maxmem: 64 * 1024 * 1024 }, (err, key) =>
			err ? reject(err) : resolve(key)
		)
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const key = await scrypt(password, salt, SCRYPT.keylen, SCRYPT);
	return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
	const [algo, N, r, p, salt, hash] = stored.split('$');
	if (algo !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'base64');
	const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: +N!, r: +r!, p: +p! });
	return timingSafeEqual(key, expected);
}

/** Hash used to keep sign-in timing equal whether or not the email exists. */
let dummyHash: Promise<string> | null = null;
export function dummyPasswordHash() {
	dummyHash ??= hashPassword(randomBytes(12).toString('hex'));
	return dummyHash;
}

// ---------------------------------------------------------------- sessions

export const SESSION_COOKIE = 'sqwer_session';
const SESSION_DAYS = 30;
const RENEW_WHEN_DAYS_LEFT = 15;
/**
 * However active it is, a session ends this long after sign-in, so a copied session cookie stops
 * working on its own even if it keeps being used.
 */
const MAX_SESSION_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function describeDevice(userAgent: string | null): string {
	if (!userAgent) return 'Unknown device';
	const browser = /Edg\//.test(userAgent)
		? 'Edge'
		: /Firefox\//.test(userAgent)
			? 'Firefox'
			: /Chrome\//.test(userAgent)
				? 'Chrome'
				: /Safari\//.test(userAgent)
					? 'Safari'
					: 'Browser';
	const os = /Windows/.test(userAgent)
		? 'Windows'
		: /iPhone|iPad/.test(userAgent)
			? 'iOS'
			: /Mac OS X/.test(userAgent)
				? 'macOS'
				: /Android/.test(userAgent)
					? 'Android'
					: /Linux/.test(userAgent)
						? 'Linux'
						: 'another system';
	return `${browser} on ${os}`;
}

export async function createSession(userId: string, userAgent: string | null) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
	const d = await db();
	await d.insert(sessions).values({ id: sha256(token), userId, expiresAt, device: describeDevice(userAgent) });
	return { token, expiresAt, id: sha256(token) };
}

export async function validateSession(token: string) {
	const d = await db();
	const id = sha256(token);
	const rows = await d
		.select({ session: sessions, user: { id: users.id, email: users.email, createdAt: users.createdAt, role: users.role } })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, id))
		.limit(1);
	const row = rows[0];
	if (!row) return null;
	const now = Date.now();
	const absoluteEnd = row.session.createdAt.getTime() + MAX_SESSION_DAYS * DAY;
	if (row.session.expiresAt.getTime() <= now || absoluteEnd <= now) {
		await d.delete(sessions).where(eq(sessions.id, id));
		return null;
	}
	let renewed = false;
	if (row.session.expiresAt.getTime() - now < RENEW_WHEN_DAYS_LEFT * DAY && row.session.expiresAt.getTime() < absoluteEnd) {
		row.session.expiresAt = new Date(Math.min(now + SESSION_DAYS * DAY, absoluteEnd));
		renewed = true;
	}
	// "Last active" is kept to the minute, so most requests need no write.
	if (renewed || now - row.session.lastSeenAt.getTime() > 60_000) {
		await d.update(sessions).set({ expiresAt: row.session.expiresAt, lastSeenAt: new Date(now) }).where(eq(sessions.id, id));
	}
	return { ...row, renewed };
}

export async function deleteSession(id: string) {
	await (await db()).delete(sessions).where(eq(sessions.id, id));
}

/** Signs out every session of the user, optionally keeping one. */
export async function deleteUserSessions(userId: string, keepId?: string) {
	const d = await db();
	await d.delete(sessions).where(keepId ? and(eq(sessions.userId, userId), ne(sessions.id, keepId)) : eq(sessions.userId, userId));
}

/** The oldest sign-in time a session may still have (see MAX_SESSION_DAYS). */
const oldestSignIn = () => new Date(Date.now() - MAX_SESSION_DAYS * DAY);

export async function deleteExpiredSessions() {
	await (await db()).delete(sessions).where(or(lt(sessions.expiresAt, new Date()), lt(sessions.createdAt, oldestSignIn())));
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date, secure: boolean) {
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires: expiresAt });
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// ---------------------------------------------------------------- users

export const newUserId = () => randomUUID();

export async function findUserByEmail(email: string) {
	const rows = await (await db()).select().from(users).where(eq(users.email, email)).limit(1);
	return rows[0] ?? null;
}

// ---------------------------------------------------------------- recovery codes

// Unambiguous alphabet: no 0/O, 1/I/L.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const RECOVERY_CODE_COUNT = 8;

function newCode() {
	const bytes = randomBytes(12);
	let out = '';
	for (let i = 0; i < 12; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
	return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

const normaliseCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Replaces the user's recovery codes and returns the new ones (shown once). */
export async function issueRecoveryCodes(userId: string): Promise<string[]> {
	const codes = Array.from({ length: RECOVERY_CODE_COUNT }, newCode);
	const d = await db();
	await d.transaction(async (tx) => {
		await tx.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
		await tx.insert(recoveryCodes).values(codes.map((c) => ({ userId, codeHash: sha256(normaliseCode(c)) })));
	});
	return codes;
}

/** Marks a matching unused code as used. Returns false when none matches. */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
	const d = await db();
	const rows = await d
		.update(recoveryCodes)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(recoveryCodes.userId, userId),
				eq(recoveryCodes.codeHash, sha256(normaliseCode(code))),
				isNull(recoveryCodes.usedAt)
			)
		)
		.returning({ id: recoveryCodes.id });
	return rows.length > 0;
}

export async function remainingRecoveryCodes(userId: string): Promise<number> {
	const rows = await (await db())
		.select({ id: recoveryCodes.id })
		.from(recoveryCodes)
		.where(and(eq(recoveryCodes.userId, userId), isNull(recoveryCodes.usedAt)));
	return rows.length;
}

export async function activeSessions(userId: string) {
	return (await db())
		.select({ id: sessions.id, device: sessions.device, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt })
		.from(sessions)
		.where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date()), gt(sessions.createdAt, oldestSignIn())))
		.orderBy(sessions.lastSeenAt);
}
