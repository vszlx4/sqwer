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
			isPublic: false,
			headline: ' Practising every morning ',
			pronouns: 'they/them',
			banner: 'ocean',
			showRank: true,
			showStats: false,
			showStreak: true
		};
		const ok = profileSchema.parse(base);
		expect(ok.headline).toBe('Practising every morning');
		expect(profileSchema.safeParse({ ...base, banner: 'neon' }).success).toBe(false);
		expect(profileSchema.safeParse({ ...base, headline: 'x'.repeat(81) }).success).toBe(false);
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

describe('verification challenge', async () => {
	const { checkAnswer, createChallenge, drawCharacters } = await import('./captcha.ts');

	it('draws characters as paths, without the characters as text', () => {
		const svg = drawCharacters('AC347');
		expect(svg.startsWith('<svg')).toBe(true);
		expect(svg).not.toMatch(/<text|AC347/);
		expect(svg.match(/<path/g)!.length).toBeGreaterThan(5 + 2);
	});

	it('rejects wrong answers, spent tokens and malformed tokens', () => {
		const a = createChallenge('image');
		const b = createChallenge('image');
		expect(checkAnswer(a.token, 'wrong')).toBe(false);
		// A token is spent by any attempt, so it cannot be guessed repeatedly.
		expect(checkAnswer(a.token, 'anything')).toBe(false);
		expect(checkAnswer(b.token + 'x', 'abc')).toBe(false);
		expect(checkAnswer('not.a-token', 'abc')).toBe(false);
	});

	it('issues answerable text questions, accepted once each', () => {
		const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
		const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
		const solve = (q: string) => {
			let m = q.match(/the (\w+) letter of the word “(\w+)”/);
			if (m) return m[2]![ordinals.indexOf(m[1]!)]!;
			m = q.match(/What is (\w+) plus (\w+)\?/);
			if (m) return String(numbers.indexOf(m[1]!) + numbers.indexOf(m[2]!));
			return q.match(/list: (.+)\./)![1]!.split(', ').at(-1)!;
		};
		for (let i = 0; i < 30; i++) {
			const c = createChallenge('text');
			expect(c.svg).toBeUndefined();
			const answer = solve(c.question!);
			expect(checkAnswer(c.token, ` ${answer.toUpperCase()} `)).toBe(true);
			expect(checkAnswer(c.token, answer)).toBe(false);
		}
	});

	it('rejects a tampered token', () => {
		const { token } = createChallenge('text');
		const [body, sig] = token.split('.');
		const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body!, 'base64url').toString()), exp: Date.now() + 1e9 })).toString('base64url');
		expect(checkAnswer(`${forged}.${sig}`, 'x')).toBe(false);
	});
});
