import { describe, expect, it } from 'vitest';
import { describeDevice, hashPassword, verifyPassword } from './auth.ts';
import { failureLimit, rateLimit, recordFailure } from './rate-limit.ts';
import { cleanText, emailSchema, profileSchema, safeRedirect, usernameSchema } from './validation.ts';

describe('passwords', () => {
	it('hashes with a random salt and verifies only the right password', async () => {
		const a = await hashPassword('correct horse battery');
		const b = await hashPassword('correct horse battery');
		expect(a).not.toBe(b);
		expect(a.startsWith('scrypt$')).toBe(true);
		expect(await verifyPassword(a, 'correct horse battery')).toBe(true);
		expect(await verifyPassword(a, 'correct horse batterY')).toBe(false);
		expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
	});
});

describe('safeRedirect', () => {
	it('allows same-site paths and rejects open redirects', () => {
		expect(safeRedirect('/account/security', '/x')).toBe('/account/security');
		expect(safeRedirect('https://evil.example', '/x')).toBe('/x');
		expect(safeRedirect('//evil.example', '/x')).toBe('/x');
		expect(safeRedirect('/\\evil.example', '/x')).toBe('/x');
		expect(safeRedirect(null, '/x')).toBe('/x');
	});
});

describe('input sanitising and validation', () => {
	it('removes control and text-direction characters', () => {
		expect(cleanText('Ali‮ce\u0007​')).toBe('Alice');
	});

	it('normalises email addresses', () => {
		expect(emailSchema.parse('  Person@Example.COM ')).toBe('person@example.com');
		expect(emailSchema.safeParse('not an email').success).toBe(false);
	});

	it('enforces username rules and reserved names', () => {
		expect(usernameSchema.parse('Fast_Typist')).toBe('fast_typist');
		expect(usernameSchema.safeParse('ab').success).toBe(false);
		expect(usernameSchema.safeParse('admin').success).toBe(false);
		expect(usernameSchema.safeParse('<script>').success).toBe(false);
	});

	it('validates a full profile and rejects out-of-range values', () => {
		const base = {
			displayName: '  Test Typist ',
			username: 'test_typist',
			bio: 'Hello\n\n\n\nthere',
			experience: 'advanced',
			goal: 'speed',
			targetWpm: '90',
			platform: 'mac',
			avatarColor: 'lime',
			isPublic: false
		};
		const ok = profileSchema.parse(base);
		expect(ok.displayName).toBe('Test Typist');
		expect(ok.bio).toBe('Hello\n\nthere');
		expect(ok.targetWpm).toBe(90);
		expect(profileSchema.safeParse({ ...base, targetWpm: '999' }).success).toBe(false);
		expect(profileSchema.safeParse({ ...base, goal: 'hacking' }).success).toBe(false);
	});
});

describe('rate limiting', () => {
	it('blocks after the limit within the window', () => {
		const key = `test:${Math.random()}`;
		for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
		const blocked = rateLimit(key, 3, 60_000);
		expect(blocked.ok).toBe(false);
		expect(blocked.retryAfter).toBeGreaterThan(0);
	});

	it('counts only recorded failures', () => {
		const key = `fail:${Math.random()}`;
		expect(failureLimit(key, 2, 60_000).ok).toBe(true);
		recordFailure(key);
		recordFailure(key);
		expect(failureLimit(key, 2, 60_000).ok).toBe(false);
	});
});

describe('describeDevice', () => {
	it('summarises a user agent without storing it', () => {
		expect(
			describeDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/130.0 Safari/537.36')
		).toBe('Chrome on macOS');
		expect(describeDevice(null)).toBe('Unknown device');
	});
});
