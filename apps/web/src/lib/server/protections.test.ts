import { randomUUID } from 'node:crypto';
import { computeStats, TypingSession } from '@sqwer/engine';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { toDetail } from '#lib/results/detail.ts';
import { checkAnalyticsToken, issueAnalyticsToken } from './analytics/token.ts';
import { checkResult, maxStarsFor, type ResultClaim } from './anticheat.ts';
import { createSession, SESSION_COOKIE, validateSession } from './auth.ts';
import { bodyLimit, checkBody, DEFAULT_BODY_LIMIT } from './body-limits.ts';
import { db, schema } from './db/index.ts';
import { suspendUser, unsuspendUser } from './moderation.ts';
import { spendBudget } from './rate-limit.ts';
import { base32Decode, base32Encode, codeAt, decryptSecret, encryptSecret, newTotpSecret, stepAt, verifyCode } from './totp.ts';

/* ---------------------------------------------------------------- TOTP */

describe('authenticator codes (RFC 6238)', () => {
	// The RFC's SHA-1 test secret, "12345678901234567890".
	const rfcSecret = base32Encode(Buffer.from('12345678901234567890'));

	it('matches the published test vectors', () => {
		expect(codeAt(rfcSecret, Math.floor(59 / 30), 8)).toBe('94287082');
		expect(codeAt(rfcSecret, Math.floor(1111111109 / 30), 8)).toBe('07081804');
		expect(codeAt(rfcSecret, Math.floor(1234567890 / 30), 8)).toBe('89005924');
		expect(codeAt(rfcSecret, Math.floor(2000000000 / 30), 8)).toBe('69279037');
	});

	it('round-trips base32 and creates 160-bit secrets', () => {
		const s = newTotpSecret();
		expect(s).toMatch(/^[A-Z2-7]{32}$/);
		expect(base32Decode(s)).toHaveLength(20);
		expect(base32Encode(base32Decode(s))).toBe(s);
	});

	it('accepts the current code once, with one step of clock drift, and never a used step again', () => {
		const s = newTotpSecret();
		const now = Date.now();
		const step = stepAt(now);
		expect(verifyCode(s, codeAt(s, step), null, now)).toBe(step);
		expect(verifyCode(s, codeAt(s, step - 1), null, now)).toBe(step - 1);
		expect(verifyCode(s, codeAt(s, step - 2), null, now)).toBeNull();
		// Replay: the step already used, or an older one, is refused.
		expect(verifyCode(s, codeAt(s, step), step, now)).toBeNull();
		expect(verifyCode(s, codeAt(s, step - 1), step, now)).toBeNull();
		expect(verifyCode(s, '12345', null, now)).toBeNull();
		expect(verifyCode(s, 'abcdef', null, now)).toBeNull();
	});

	it('stores secrets encrypted and detects tampering', () => {
		const s = newTotpSecret();
		const stored = encryptSecret(s);
		expect(stored).not.toContain(s);
		expect(decryptSecret(stored)).toBe(s);
		const parts = stored.split('.');
		parts[3] = Buffer.from('tampered').toString('base64url');
		expect(() => decryptSecret(parts.join('.'))).toThrow();
	});
});

/* ---------------------------------------------------------------- suspension */

describe('account suspension', () => {
	it('ends every session at once and blocks sessions until lifted', async () => {
		const d = await db();
		const id = randomUUID();
		await d.insert(schema.users).values({ id, email: `${id}@example.com`, passwordHash: 'x' });
		const a = await createSession(id, null);
		const b = await createSession(id, null);
		await suspendUser(id, 'spam', null);
		expect(await validateSession(a.token)).toBeNull();
		expect(await validateSession(b.token)).toBeNull();
		expect(await d.select().from(schema.sessions).where(eq(schema.sessions.userId, id))).toHaveLength(0);
		// A session that somehow exists for a suspended account is refused too.
		const c = await createSession(id, null);
		expect(await validateSession(c.token)).toBeNull();
		await unsuspendUser(id, null);
		const e = await createSession(id, null);
		expect(await validateSession(e.token)).not.toBeNull();
	});
});

/* ---------------------------------------------------------------- results */

/** A real test, typed with the engine at the given intervals. */
function typed(words: string[], gap: (i: number) => number, seconds = 30): ResultClaim {
	const s = new TypingSession(words, { kind: 'time', seconds });
	let t = 1000;
	let i = 0;
	for (const [w, word] of words.entries()) {
		for (const ch of word + (w < words.length - 1 ? ' ' : '')) {
			s.type(ch, t);
			t += gap(i++);
		}
	}
	s.finish(1000 + seconds * 1000);
	const stats = computeStats(s);
	return { status: 'completed', at: Date.now(), wpm: stats.wpm, accuracy: stats.accuracy, seconds: stats.seconds, detail: toDetail(s, stats) };
}

const WORDS = 'the quick brown fox jumps over the lazy dog while seven small birds sing near an old river bank under a bright sky'.split(' ');
// A person: about 75 WPM, with uneven gaps.
const human = (i: number) => 120 + ((i * 37) % 90) + (i % 7 === 0 ? 140 : 0);

describe('result checks', () => {
	it('trusts a real result and recomputes its figures', () => {
		const r = typed(WORDS, human);
		const v = checkResult(r);
		expect(v.kind).toBe('trusted');
		if (v.kind === 'trusted') expect(v.stats.wpm).toBeCloseTo(r.wpm, 5);
	});

	it('rejects figures the keystrokes do not produce', () => {
		const r = typed(WORDS, human);
		expect(checkResult({ ...r, wpm: r.wpm + 40 }).kind).toBe('reject');
		expect(checkResult({ ...r, accuracy: 100, detail: r.detail }).kind).toBe(r.accuracy === 100 ? 'trusted' : 'reject');
	});

	it('rejects forged keystroke records', () => {
		const r = typed(WORDS, human);
		const d = r.detail!;
		// Counts that do not match the keystrokes.
		expect(checkResult({ ...r, detail: { ...d, keystrokes: { ...d.keystrokes, total: d.keystrokes.total + 5 } } })).toMatchObject({ kind: 'reject', reason: 'keystroke-counts' });
		// Keystrokes out of order.
		const swapped = [...d.replay];
		[swapped[3], swapped[4]] = [[swapped[4]![0] + 500, swapped[3]![1]], swapped[3]!];
		expect(checkResult({ ...r, detail: { ...d, replay: swapped as typeof d.replay } }).kind).toBe('reject');
		// Keystrokes after the test ended.
		expect(checkResult({ ...r, seconds: 5 }).kind).toBe('reject');
		// From the future.
		expect(checkResult({ ...r, at: Date.now() + 60 * 60 * 1000 })).toMatchObject({ kind: 'reject', reason: 'from-the-future' });
	});

	it('rejects speeds and bursts no person reaches', () => {
		expect(checkResult(typed(WORDS, () => 15, 10)).kind).toBe('reject');
		// A burst: 40 characters within a second, inside an otherwise ordinary test.
		const burst = typed(WORDS, (i) => (i >= 20 && i < 60 ? 20 : human(i)));
		expect(checkResult(burst)).toMatchObject({ kind: 'reject' });
	});

	it('does not rate machine-regular timing or results without a keystroke record', () => {
		expect(checkResult(typed(WORDS, () => 100))).toMatchObject({ kind: 'untrusted', reason: 'machine-regular-timing' });
		const r = typed(WORDS, human);
		expect(checkResult({ ...r, detail: undefined })).toMatchObject({ kind: 'untrusted', reason: 'no-keystroke-record' });
	});

	it('counts only typing time, not idle time added to the duration', () => {
		const r = typed(WORDS.slice(0, 6), human, 120);
		const v = checkResult(r);
		expect(v.kind).not.toBe('reject');
		if (v.kind !== 'reject') expect(v.stats!.activeSeconds).toBeLessThan(15);
	});

	it('limits lesson stars by accuracy', () => {
		expect(maxStarsFor(100)).toBe(3);
		expect(maxStarsFor(95)).toBe(2);
		expect(maxStarsFor(80)).toBe(1);
	});

	it('budgets typing time per hour', () => {
		const key = `budget:${randomUUID()}`;
		expect(spendBudget(key, 3000, 3900, 60_000)).toBe(true);
		expect(spendBudget(key, 1000, 3900, 60_000)).toBe(false);
		expect(spendBudget(key, 900, 3900, 60_000)).toBe(true);
	});
});

/* ---------------------------------------------------------------- body limits */

describe('request body limits', () => {
	const url = (path: string) => new URL(`https://sqwer.example${path}`);
	const headers = (h: Record<string, string>) => new Headers(h);

	it('keeps forms small and allows large bodies only where needed', () => {
		expect(bodyLimit('POST', url('/signin'))).toBe(DEFAULT_BODY_LIMIT);
		expect(DEFAULT_BODY_LIMIT).toBeLessThan(100 * 1024);
		expect(bodyLimit('PUT', url('/api/fingermap'))).toBe(6 * 1024 * 1024);
		expect(bodyLimit('POST', url('/api/fingermap'))).toBe(DEFAULT_BODY_LIMIT);
		expect(bodyLimit('POST', url('/account/profile?/avatar'))).toBeGreaterThan(1024 * 1024);
		expect(bodyLimit('POST', url('/account/profile?/save'))).toBe(DEFAULT_BODY_LIMIT);
		expect(checkBody('POST', url('/signin'), headers({ 'content-length': String(200 * 1024) }))).toBe('too-large');
		expect(checkBody('POST', url('/signin'), headers({ 'content-length': '900' }))).toBe('ok');
		expect(checkBody('POST', url('/signin'), headers({ 'transfer-encoding': 'chunked' }))).toBe('length-required');
		expect(checkBody('GET', url('/signin'), headers({}))).toBe('ok');
	});
});

/* ---------------------------------------------------------------- analytics tokens */

describe('analytics tokens', () => {
	const UA = 'Mozilla/5.0 test';
	it('accept only genuine, current tokens from the same browser', () => {
		const now = Date.now();
		const t = issueAnalyticsToken(UA, now);
		expect(checkAnalyticsToken(t, UA, now)).toEqual(expect.any(String));
		expect(checkAnalyticsToken(t, 'another browser', now)).toBeNull();
		expect(checkAnalyticsToken(t, UA, now + 25 * 60 * 60 * 1000)).toBeNull();
		expect(checkAnalyticsToken(`${t.split('.')[0]}.forged`, UA, now)).toBeNull();
		expect(checkAnalyticsToken(undefined, UA, now)).toBeNull();
	});
});

/* ---------------------------------------------------------------- cookie */

describe('session cookie', () => {
	it('uses the __Host- prefix on an HTTPS site', () => {
		// The unit tests run with PUBLIC_SITE_URL=https://sqwer.example.
		expect(SESSION_COOKIE).toBe('__Host-sqwer_session');
	});
});
