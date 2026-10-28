import { describe, expect, it } from 'vitest';
import { describeDevice, hashPassword, newCode, verifyPassword } from './auth.ts';
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

	it('rejects targets that a browser would resolve to another site', () => {
		// Browsers drop tabs and newlines from addresses: "/\t/evil.example" becomes "//evil.example".
		for (const t of ['/\t/evil.example', '/\n/evil.example', '/\r\n/evil.example', '/\\/evil.example', '/\t\\evil.example']) {
			expect(safeRedirect(t, '/x')).toBe('/x');
		}
		expect(safeRedirect('/admin/analytics?range=7d#top', '/x')).toBe('/admin/analytics?range=7d#top');
		expect(safeRedirect('/%09/evil.example', '/x')).toBe('/%09/evil.example');
		expect(new URL(safeRedirect('/%09/evil.example', '/x'), 'https://sqwer.example').host).toBe('sqwer.example');
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
			headline: ' Practicing every morning ',
			pronouns: 'they/them',
			banner: 'ocean',
			showRank: true,
			showStats: false,
			showStreak: true,
			showOnLeaderboard: true
		};
		const ok = profileSchema.parse(base);
		expect(ok.headline).toBe('Practicing every morning');
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

describe('recovery codes', () => {
	it('are three groups of four from the unambiguous alphabet', () => {
		for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
	});

	it('draw every character evenly', () => {
		const counts = new Map<string, number>();
		const n = 30_000;
		for (let i = 0; i < n; i++) for (const c of newCode().replaceAll('-', '')) counts.set(c, (counts.get(c) ?? 0) + 1);
		expect(counts.size).toBe(31);
		// 360k draws: ~11613 per character, sd ~106. The old byte modulo gave A-H ~12656.
		const expected = (n * 12) / 31;
		for (const count of counts.values()) expect(Math.abs(count - expected)).toBeLessThan(expected * 0.05);
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

	it('never reveals a character through its path data or the element order', () => {
		// The glyph paths for A and T, as defined in captcha.ts: a script could look these up.
		const svg = drawCharacters('ATATA');
		expect(svg).not.toContain('M0 14 L5 0 L10 14');
		expect(svg).not.toContain('M0 0 H10 M5 0 V14');
		expect(svg).not.toMatch(/transform=|scale\(/);
		// The same character is never drawn with the same path twice.
		const glyphPaths = (s: string) => [...s.matchAll(/<path d="([^"]+)" stroke-width="[\d.]+"\/>/g)].map((m) => m[1]!).filter((d) => d.split(' ').length > 6);
		const first = glyphPaths(drawCharacters('AAAAA'));
		expect(new Set(first).size).toBe(first.length);
		expect(first.some((d) => glyphPaths(drawCharacters('AAAAA')).includes(d))).toBe(false);
	});

	const UA = 'Mozilla/5.0 test browser';

	it('rejects wrong answers, spent tokens and malformed tokens', async () => {
		const a = createChallenge('image', 'signin', UA);
		const b = createChallenge('image', 'signin', UA);
		expect(await checkAnswer(a.token, 'wrong', 'signin', UA)).toBe(false);
		// A token is spent by any attempt, so it cannot be guessed repeatedly.
		expect(await checkAnswer(a.token, 'anything', 'signin', UA)).toBe(false);
		expect(await checkAnswer(b.token + 'x', 'abc', 'signin', UA)).toBe(false);
		expect(await checkAnswer('not.a-token', 'abc', 'signin', UA)).toBe(false);
	});

	const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
	const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
	/** A solver for every phrasing, as a determined script would write one. */
	const solve = (q: string) => {
		let m = q.match(/the (\w+) letter of the word “(\w+)”|Which letter comes (\w+) in “(\w+)”|In the word “(\w+)”, type the letter in position (\w+)/);
		if (m) {
			const word = m[2] ?? m[4] ?? m[5]!;
			const index = m[1] ? ordinals.indexOf(m[1]) : m[3] ? ordinals.indexOf(m[3]) : numbers.indexOf(m[6]!) - 1;
			return word[index]!;
		}
		m = q.match(/What is (\w+) plus (\w+)\?|Add (\w+) to (\w+)\.|have (\w+) keys and press (\w+) more/);
		if (m) {
			const [x, y] = [m[1] ?? m[3] ?? m[5], m[2] ?? m[4] ?? m[6]].map((w) => numbers.indexOf(w!));
			return String(x! + y!);
		}
		m = q.match(/(first|second|last)/)!;
		const list = q.match(/(?:list: |words |words: )([a-z]+, [a-z]+, [a-z]+)/)![1]!.split(', ');
		return list[['first', 'second', 'last'].indexOf(m[1]!)]!;
	};

	it('issues answerable text questions, accepted once each', async () => {
		for (let i = 0; i < 40; i++) {
			const c = createChallenge('text', 'signup', UA);
			expect(c.svg).toBeUndefined();
			const answer = solve(c.question!);
			expect(await checkAnswer(c.token, ` ${answer.toUpperCase()} `, 'signup', UA)).toBe(true);
			expect(await checkAnswer(c.token, answer, 'signup', UA)).toBe(false);
		}
	});

	it('accepts a challenge only for the form and the browser it was issued to', async () => {
		const forSignin = createChallenge('text', 'signin', UA);
		expect(await checkAnswer(forSignin.token, solve(forSignin.question!), 'signup', UA)).toBe(false);
		const elsewhere = createChallenge('text', 'signin', UA);
		expect(await checkAnswer(elsewhere.token, solve(elsewhere.question!), 'signin', 'curl/8.0')).toBe(false);
	});

	it('rejects an expired challenge', async () => {
		const c = createChallenge('text', 'reset', UA);
		expect(await checkAnswer(c.token, solve(c.question!), 'reset', UA, Date.now() + 11 * 60 * 1000)).toBe(false);
	});

	it('rejects a tampered token', async () => {
		const { token } = createChallenge('text', 'signin', UA);
		const [body, sig] = token.split('.');
		const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body!, 'base64url').toString()), exp: Date.now() + 1e9, act: 'signup' })).toString('base64url');
		expect(await checkAnswer(`${forged}.${sig}`, 'x', 'signup', UA)).toBe(false);
	});
});
