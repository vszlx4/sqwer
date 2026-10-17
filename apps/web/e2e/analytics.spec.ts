import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request } from '@playwright/test';
import { solveCaptcha } from './human.ts';

/*
 * Analytics end to end, against the real server: consent before any collection, server events
 * from real registrations and sign-ins, and access to the dashboard for administrators only. The
 * administrator and member accounts are created by scripts/seed-e2e.mjs before the server starts.
 */

const ADMIN = { email: 'admin@e2e.test', password: 'E2e-admin-pass-2026' };
const MEMBER = { email: 'member@e2e.test', password: 'E2e-member-pass-2026' };
const NO_STORAGE = { cookies: [], origins: [] };

// Its own client address, so the limits it reaches do not affect other files.
test.use({ extraHTTPHeaders: { 'x-forwarded-for': '10.20.0.1' } });

/** Collects the analytics batches the page sends. */
function watchAnalytics(page: Page) {
	const sent: { type: string; path: string }[] = [];
	page.on('request', (r: Request) => {
		if (r.url().endsWith('/api/analytics') && r.method() === 'POST') {
			for (const e of (r.postDataJSON()?.events ?? []) as { type: string; path: string }[]) sent.push(e);
		}
	});
	return sent;
}

async function signIn(page: Page, who: { email: string; password: string }, password = who.password) {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(who.email);
	await page.getByLabel('Password').fill(password);
	await solveCaptcha(page);
	await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.getByRole('button', { name: 'Sign in' }).click()]);
}

test.describe('consent', () => {
	test.use({ storageState: NO_STORAGE });

	test('collects nothing until the visitor allows it', async ({ page }) => {
		const sent = watchAnalytics(page);
		await page.goto('/');
		const banner = page.getByRole('region', { name: 'Can sqwer count your visit?' });
		await expect(banner).toBeVisible();
		const axe = await new AxeBuilder({ page }).include('.consent').analyze();
		expect(axe.violations).toEqual([]);

		await page.goto('/learn');
		await page.waitForTimeout(2500);
		expect(sent).toEqual([]);
		expect(await page.evaluate(() => localStorage.getItem('sqwer:analytics-id'))).toBeNull();

		await Promise.all([page.waitForRequest((r) => r.url().endsWith('/api/analytics')), banner.getByRole('button', { name: 'Allow' }).click()]);
		await expect(banner).toBeHidden();
		expect(sent.some((e) => e.type === 'pageview' && e.path === '/learn')).toBe(true);
		expect(await page.evaluate(() => localStorage.getItem('sqwer:analytics-id'))).toMatch(/^[0-9a-f-]{36}$/);

		// Withdrawing consent from the footer deletes the identifier and stops collection.
		await page.getByRole('button', { name: 'Analytics preferences' }).click();
		await banner.getByRole('button', { name: 'No, thanks' }).click();
		expect(await page.evaluate(() => localStorage.getItem('sqwer:analytics-id'))).toBeNull();
		const views = () => sent.filter((e) => e.type === 'pageview').length;
		const before = views();
		await page.getByRole('link', { name: 'Practice', exact: true }).first().click();
		await expect(page).toHaveURL(/\/exams$/);
		await page.waitForTimeout(2500);
		expect(views()).toBe(before);
	});

	test('honours Global Privacy Control without asking', async ({ page }) => {
		await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
		const sent = watchAnalytics(page);
		await page.goto('/');
		await page.waitForTimeout(1500);
		await expect(page.getByRole('region', { name: 'Can sqwer count your visit?' })).toBeHidden();
		expect(sent).toEqual([]);
	});

	test('refuses malformed and cross-site analytics requests', async ({ request, baseURL }) => {
		const bad = await request.post('/api/analytics', { data: { events: [{ type: 'pageview', path: 'https://evil.example' }] }, headers: { origin: baseURL! } });
		expect(bad.status()).toBe(400);
		const foreign = await request.post('/api/analytics', { data: { events: [] }, headers: { origin: 'https://evil.example' } });
		expect(foreign.status()).toBe(403);
	});
});

test.describe('dashboard access', () => {
	test('sends visitors who are not signed in to sign in, and refuses the export', async ({ page }) => {
		await page.goto('/admin/analytics?range=7d');
		await expect(page).toHaveURL(/\/signin\?redirectTo=%2Fadmin%2Fanalytics%3Frange%3D7d$/);
		const res = await page.request.get('/admin/analytics/export?range=7d');
		expect(res.status()).toBe(401);
	});

	test('hides the dashboard from members', async ({ page }) => {
		await signIn(page, MEMBER);
		await expect(page).toHaveURL(/\/account\/setup$/);
		const res = await page.goto('/admin/analytics');
		expect(res?.status()).toBe(404);
		expect((await page.request.get('/admin/analytics/events')).status()).toBe(404);
		expect((await page.request.get('/admin/analytics/export')).status()).toBe(403);
	});
});

test.describe.serial('administrator', () => {
	const newcomer = `newcomer-${Date.now()}@example.com`;

	test('a real registration is recorded as a server event', async ({ page }) => {
		await page.goto('/signup');
		await page.getByLabel('Email address').fill(newcomer);
		await page.getByLabel('Password', { exact: true }).fill('a-long-test-passphrase');
		await page.getByLabel('Confirm password').fill('a-long-test-passphrase');
		await page.getByLabel(/I accept the Terms and Conditions/).check();
		await page.getByLabel(/at least 16 years old/).check();
		await solveCaptcha(page);
		await page.waitForTimeout(2600);
		await page.getByRole('button', { name: 'Create account' }).click();
		await expect(page.getByRole('heading', { name: 'Your account has been created' })).toBeVisible();
	});

	test('sees the dashboard, the events and the export', async ({ page }) => {
		// A failed attempt first, then the right password.
		await signIn(page, ADMIN, 'not-the-password-1');
		await expect(page.getByRole('alert')).toContainText('The email address or password is incorrect.');
		await page.getByLabel('Password').fill(ADMIN.password);
		await solveCaptcha(page);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/account\/setup$/);

		await page.goto('/admin/analytics?range=7d');
		await expect(page.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Key figures' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Analytics views' })).toBeVisible();
		const axe = await new AxeBuilder({ page }).include('main').analyze();
		expect(axe.violations).toEqual([]);

		// Server events from this run, listed individually.
		await page.goto('/admin/analytics/events?range=7d&event=signup_completed');
		await expect(page.getByRole('status').filter({ hasText: /\d+ events?/ })).toBeVisible();
		await expect(page.locator('tbody tr').first()).toContainText('Registration');

		await page.goto('/admin/analytics/events?range=7d&event=signin_failed');
		await expect(page.locator('tbody tr').first()).toContainText('reason: credentials');

		await page.goto('/admin/analytics/events?range=7d&event=signin_succeeded');
		await expect(page.locator('tbody tr').first()).toContainText('Signed in');

		const download = page.waitForEvent('download');
		await page.getByRole('link', { name: 'Export CSV' }).click();
		const file = await download;
		const csv = await (await file.createReadStream()).toArray().then((chunks) => Buffer.concat(chunks).toString('utf8'));
		const [header, ...rows] = csv.trim().split('\r\n');
		expect(header).toBe('time_utc,source,event,page,route,channel,referrer,device,browser,os,signed_in,visit,visible_ms,details');
		expect(rows.length).toBeGreaterThan(0);
		expect(rows.every((r) => r.includes(',signin_succeeded,'))).toBe(true);
		expect(csv).not.toContain(ADMIN.email);
	});

	test('pages through events with a cursor', async ({ page }) => {
		await signIn(page, ADMIN);
		const res = await page.goto('/admin/analytics/events?range=7d&after=garbage');
		expect(res?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
	});
});
