import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { solveCaptcha } from './human.ts';

/* Request limits, analytics tokens, session cookie and result checks. One client address per test. */

const ORIGIN = 'http://localhost:4321';
const PLAYER = { email: 'player@e2e.test', password: 'E2e-player-pass-2026' };

async function signIn(page: Page, who: { email: string; password: string }) {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(who.email);
	await page.getByLabel('Password').fill(who.password);
	if (await page.locator('.captcha').isVisible()) await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account/);
}

test.use({ extraHTTPHeaders: { 'x-forwarded-for': '10.30.0.1' } });

test('forms and small endpoints refuse large bodies; the finger map may be larger', async ({ request }) => {
	const big = 'x'.repeat(200 * 1024);
	const signin = await request.post('/signin', { headers: { origin: ORIGIN, 'content-type': 'application/x-www-form-urlencoded' }, data: `email=a%40b.c&password=${big}` });
	expect(signin.status()).toBe(413);
	const api = await request.post('/api/courses', { headers: { origin: ORIGIN, 'content-type': 'application/json' }, data: JSON.stringify({ pad: big }) });
	expect(api.status()).toBe(413);
	// 200 KB is within the finger map's limit: it reaches the endpoint, which then asks for a session.
	const map = await request.put('/api/fingermap', { headers: { origin: ORIGIN, 'content-type': 'application/json' }, data: JSON.stringify({ pad: big }) });
	expect(map.status()).toBe(401);
});

test('analytics events need the token issued with a page, from the same browser', async ({ page }) => {
	await page.goto('/');
	const token = await page.evaluate(async () => {
		// The token is part of the page data; read it the way the page itself does.
		const res = await fetch('/__data.json?x-sveltekit-invalidated=1');
		const text = await res.text();
		return /"analyticsToken":"([^"]+)"/.exec(text)?.[1] ?? /([A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{43})/.exec(text)?.[1] ?? null;
	});
	expect(token).toBeTruthy();
	const event = { id: randomUUID(), type: 'pageview', at: Date.now(), path: '/', route: '/', visitor: randomUUID(), session: randomUUID() };
	const headers = { origin: ORIGIN, 'content-type': 'application/json' };
	const without = await page.request.post('/api/analytics', { headers, data: { events: [event] } });
	expect(without.status()).toBe(403);
	const forged = await page.request.post('/api/analytics', { headers, data: { token: `${token!.split('.')[0]}.forged`, events: [event] } });
	expect(forged.status()).toBe(403);
	const otherBrowser = await page.request.post('/api/analytics', { headers: { ...headers, 'user-agent': 'curl/8' }, data: { token, events: [event] } });
	expect(otherBrowser.status()).toBe(403);
	const ok = await page.request.post('/api/analytics', { headers, data: { token, events: [event] } });
	expect(ok.status()).toBe(202);
});

test.describe('signed in as a player', () => {
	test.use({ extraHTTPHeaders: { 'x-forwarded-for': '10.30.0.2' } });

	test('the session cookie is HttpOnly and SameSite=Lax', async ({ page, context }) => {
		await signIn(page, PLAYER);
		const cookie = (await context.cookies()).find((c) => c.name === 'sqwer_session' || c.name === '__Host-sqwer_session');
		expect(cookie).toBeTruthy();
		// Plain HTTP (this test server) keeps the plain name; HTTPS sites use the __Host- prefix (unit test).
		expect(cookie!.name).toBe('sqwer_session');
		expect(cookie!).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
		expect(cookie!.domain).toBe('localhost');
	});

	test('forged results earn no XP or are refused', async ({ page }) => {
		await signIn(page, PLAYER);
		const headers = { origin: ORIGIN, 'content-type': 'application/json' };
		const base = { exam: 'timed', status: 'completed', at: Date.now(), accuracy: 99, seconds: 60, label: 'time 60s' };
		// Without a keystroke record: kept, but no XP.
		const bare = await page.request.post('/api/results', { headers, data: { ...base, id: randomUUID(), wpm: 180 } });
		expect(bare.status()).toBe(200);
		expect(await bare.json()).toMatchObject({ xp: 0, verified: false, unrated: 'no-keystroke-record' });
		// A keystroke record that does not produce the claimed speed: refused.
		const replay = Array.from({ length: 40 }, (_, i) => [i * 150, 'abcd '[i % 5]!]);
		const detail = {
			timeline: [],
			words: [],
			targets: Array.from({ length: 8 }, () => 'abcd'),
			replay,
			chars: { correct: 40, incorrect: 0, extra: 0, missed: 0 },
			keystrokes: { total: 40, incorrect: 0, backspaces: 0 },
			missedKeys: {}
		};
		const forged = await page.request.post('/api/results', { headers, data: { ...base, id: randomUUID(), wpm: 250, detail } });
		expect(forged.status()).toBe(400);
		// From the future: refused.
		const future = await page.request.post('/api/results', { headers, data: { ...base, id: randomUUID(), wpm: 50, at: Date.now() + 3_600_000 } });
		expect(future.status()).toBe(400);
		// A lesson cannot claim more stars than its accuracy earns.
		const lesson = await page.request.post('/api/courses', { headers, data: { lessonId: 'l001', stars: 3, accuracy: 80, wpm: 40, day: '2026-10-18' } });
		expect(lesson.status()).toBe(400);
	});
});
