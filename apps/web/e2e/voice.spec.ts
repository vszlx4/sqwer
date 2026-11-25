import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { solveCaptcha } from './human.ts';

// The e2e server runs with SQWER_VOICE=pause: settings change, nothing is downloaded or made.
test.describe.configure({ mode: 'serial' });

const ORIGIN = 'http://localhost:4321';
const VOICE = { email: 'voice@e2e.test', password: 'E2e-voice-pass-2026' };
const SETTINGS = path.join('.data-e2e', 'voice', 'settings.json');

const settings = () => JSON.parse(readFileSync(SETTINGS, 'utf8'));
function saveSettings(s: object) {
	mkdirSync(path.dirname(SETTINGS), { recursive: true });
	writeFileSync(SETTINGS, JSON.stringify(s));
}

async function signIn(page: Page) {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(VOICE.email);
	await page.getByLabel('Password').fill(VOICE.password);
	if (await page.locator('.captcha').isVisible()) await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account/);
	if (!page.url().includes('/account/setup')) return;
	await page.getByRole('textbox', { name: 'Display name' }).fill('Voice Tester');
	await page.getByRole('textbox', { name: 'Username' }).fill(`voice_${Date.now() % 100000}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByText('Proficient', { exact: true }).click();
	await page.getByText('Accuracy', { exact: true }).click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByText('PC keyboard').click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByRole('button', { name: 'Complete setup' }).click();
	await expect(page).toHaveURL(/\/account\?welcome=1$/);
}

/** No axe violations in the page content at phone and laptop width, in both themes. */
async function accessible(page: Page) {
	for (const width of [375, 1024]) {
		await page.setViewportSize({ width, height: 900 });
		for (const theme of ['light', 'dark']) {
			await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
			await page.waitForTimeout(600); // colors ease into the new theme
			const axe = await new AxeBuilder({ page }).include('main').analyze();
			expect(axe.violations, `${width}px ${theme}`).toEqual([]);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no sideways scroll at ${width}px`).toBe(true);
		}
	}
	await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
	await page.setViewportSize({ width: 1280, height: 900 });
}

test.beforeAll(() => rmSync(path.dirname(SETTINGS), { recursive: true, force: true }));

test('only the machine running the copy sees or changes the voice settings', async ({ request }) => {
	const remote = { 'x-forwarded-for': '203.0.113.9' };
	expect(await (await request.get('/api/voice', { headers: remote })).json()).toEqual({ local: false, voice: 'standard' });
	const json = { origin: ORIGIN, 'content-type': 'application/json' };
	const use = JSON.stringify({ action: 'use', voice: 'supertonic' });
	expect((await request.post('/api/voice', { headers: { ...json, ...remote }, data: use })).status()).toBe(403);
	expect((await request.post('/api/voice', { headers: { ...json, origin: 'https://evil.example' }, data: use })).status()).toBe(403);
	expect((await request.post('/api/voice', { headers: { origin: ORIGIN, 'content-type': 'text/plain' }, data: use })).status()).toBe(415);
	expect((await request.post('/api/voice', { headers: json, data: JSON.stringify({ action: 'use', voice: 'robot' }) })).status()).toBe(400);

	const local = await (await request.get('/api/voice')).json();
	expect(local).toMatchObject({ local: true, voice: 'standard', chosen: 'standard', env: 'pause' });
	expect(local.sets.find((x: { id: string }) => x.id === 'english-200')).toMatchObject({ words: 200, order: 1 });
	expect(local.words).toBeLessThan(15_000);
});

test('the Sound and voice page: the choice, one status, the run settings and the word sets', async ({ page }) => {
	test.setTimeout(120_000);
	await signIn(page);
	await page.goto('/account/sound');
	await expect(page.getByRole('heading', { level: 1, name: 'Sound and voice' })).toBeVisible();
	// Standard is the default; Enhanced is opt-in, with its download size.
	await expect(page.getByRole('radio', { name: /^Standard/ })).toBeChecked();
	const enhanced = page.getByRole('radio', { name: /^Enhanced/ });
	await expect(enhanced).not.toBeChecked();
	await expect(page.locator('.choice', { hasText: 'Enhanced' })).toContainText('after a 129 MB download');
	await expect(page.getByRole('heading', { name: 'Word sets' })).toHaveCount(0);
	await accessible(page);

	await page.locator('.choice', { hasText: 'Enhanced' }).click();
	await expect(page.getByRole('heading', { name: 'Enhanced voice' })).toBeVisible();
	await expect(enhanced).toBeChecked();
	expect(settings()).toMatchObject({ voice: 'supertonic', paused: false, mode: 'low', battery: false });
	await expect(page.locator('.hero')).toContainText('words ready');
	await expect(page.locator('.hero .detail')).toContainText('SQWER_VOICE=pause');

	await page.getByRole('button', { name: 'Pause' }).click();
	await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
	expect(settings().paused).toBe(true);
	await page.getByRole('radio', { name: 'Active' }).check({ force: true });
	await expect.poll(() => settings().mode).toBe('active');
	await page.getByRole('switch', { name: 'On battery' }).check();
	await expect.poll(() => settings().battery).toBe(true);
	await page.getByRole('combobox', { name: 'Disk limit' }).selectOption('5');
	await expect.poll(() => settings().diskLimit).toBe(5);

	// Word sets: switched on in making order, the rest below; a set can go first.
	const on = page.getByRole('list', { name: 'Sets switched on' });
	await expect(on.locator('.set-name')).toHaveText([/^Lessons/, /^English 200/, /^English 1k/]);
	await page.getByRole('switch', { name: 'Legal' }).check();
	await expect.poll(() => settings().sets).toEqual(['course', 'english-200', 'english-1k', 'legal']);
	await on.locator('.set', { hasText: 'Legal' }).getByRole('button', { name: 'Make next' }).click();
	await expect.poll(() => settings().sets).toEqual(['legal', 'course', 'english-200', 'english-1k']);
	await page.getByRole('switch', { name: /^English 1k/ }).uncheck();
	await expect.poll(() => settings().sets).toEqual(['legal', 'course', 'english-200']);

	// A word rated one or two stars in the game is listed here, until cleared.
	const json = { origin: ORIGIN, 'content-type': 'application/json' };
	expect((await page.request.post('/api/voice', { headers: json, data: JSON.stringify({ action: 'flag', word: 'Water!', on: true }) })).status()).toBe(400);
	expect((await page.request.post('/api/voice', { headers: json, data: JSON.stringify({ action: 'flag', word: 'water', on: true }) })).ok()).toBe(true);
	expect((await page.request.post('/api/voice', { headers: json, data: JSON.stringify({ action: 'set', set: 'nope', on: true }) })).status()).toBe(400);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Words rated unclear' })).toBeVisible();
	await expect(page.locator('.flagged')).toHaveText('water');

	await page.getByRole('button', { name: 'Check clips' }).click();
	await expect(page.getByText('Checked 0 clips. All fine.')).toBeVisible();
	await accessible(page);
	await page.getByRole('button', { name: 'Clear the list' }).click();
	await expect(page.getByRole('heading', { name: 'Words rated unclear' })).toHaveCount(0);
	await page.getByRole('combobox', { name: 'Disk limit' }).selectOption('off');
	await expect.poll(() => settings().diskLimit).toBeNull();

	// The account menu shows the same status in one line, linking here.
	await page.reload();
	await page.getByRole('button', { name: /Account menu/ }).click();
	const status = page.getByRole('link', { name: /^Enhanced voice: Held/ });
	await expect(status).toBeVisible();
	await status.click();
	await expect(page).toHaveURL(/\/account\/sound$/);
});

test('the Listen and type menu shows the set’s words and makes it next', async ({ page }) => {
	await signIn(page);
	await page.goto('/practice/play/listen');
	const panel = page.locator('.voice', { hasText: 'Enhanced voice' });
	await expect(panel).toContainText('words of Lessons ready');
	await page.getByRole('combobox').selectOption('medical');
	await expect(panel).toContainText('words of Medical ready');
	await expect(panel).toContainText('Not one of your Enhanced sets.');
	await panel.getByRole('button', { name: 'Add and make next' }).click();
	await expect.poll(() => settings().sets[0]).toBe('medical');
	await expect(panel.getByRole('button', { name: /make next/i })).toHaveCount(0);
	const axe = await new AxeBuilder({ page }).include('main').analyze();
	expect(axe.violations).toEqual([]);

	// Back on Standard, the panel goes away and the clips stay.
	saveSettings({ ...settings(), voice: 'standard' });
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Level', exact: true })).toBeVisible();
	await expect(page.locator('.voice', { hasText: 'Enhanced voice' })).toHaveCount(0);
});
