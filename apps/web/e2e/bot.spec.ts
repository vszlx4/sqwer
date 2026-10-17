import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { DECLINED } from './consent.ts';
import { answerQuestion } from './human.ts';

/*
 * Abuse scenarios against the bot protection, each from its own client address so that the limits
 * it triggers do not affect other tests. Everything here is sent to the real server; nothing is
 * mocked.
 */

const ORIGIN = 'http://localhost:4321';

async function contextAt(browser: Browser, ip: string) {
	const context = await browser.newContext({ baseURL: ORIGIN, extraHTTPHeaders: { 'x-forwarded-for': ip }, storageState: DECLINED });
	return { context, page: await context.newPage() };
}

/** Solves the verification on the open page, as a person would. */
async function solve(page: Page) {
	const toText = page.getByRole('button', { name: 'Use a text question' });
	if (await toText.isVisible()) await toText.click();
	const question = page.locator('.captcha .question');
	await expect(question).toHaveText(/\?|\.$/);
	await page.getByRole('textbox', { name: 'Your answer' }).fill(answerQuestion((await question.textContent())!.trim()));
	await expect.poll(() => page.locator('input[name="altcha"]').inputValue(), { timeout: 30_000 }).not.toBe('');
}

/** Every protection field of the form on the page, as the browser would send them. */
async function protectionFields(page: Page) {
	return page.evaluate(() => {
		const out: Record<string, string> = {};
		for (const name of ['ticket', 'captchaToken', 'captchaAnswer', 'altcha', 'signals']) {
			const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
			if (el) out[name] = el.value;
		}
		if (!out.signals) out.signals = JSON.stringify({ k: 20, p: 6, f: 3, v: 0, t: 9000, w: 1 });
		return out;
	});
}

const post = (request: APIRequestContext, path: string, form: Record<string, string>, ip: string) =>
	request.post(path, { form, headers: { origin: ORIGIN, 'x-forwarded-for': ip }, maxRedirects: 0 });

test('direct requests without a page are refused, for every protected form', async ({ request }) => {
	const ip = '198.51.100.11';
	const signin = await post(request, '/signin', { email: 'someone@example.com', password: 'a-long-password' }, ip);
	expect(await signin.text()).toContain('Please complete the verification.');
	const signup = await post(request, '/signup', { email: 'bot@example.com', password: 'a-long-password', confirmPassword: 'a-long-password', acceptTerms: 'on', ageConfirm: 'on' }, ip);
	expect(await signup.text()).toContain('The form could not be submitted.');
	const reset = await post(request, '/reset-password', { email: 'someone@example.com', code: 'ABCD-EFGH-JKMN', password: 'a-long-password', confirmPassword: 'a-long-password' }, ip);
	expect(await reset.text()).toContain('Please complete the verification.');
});

test('forged, missing and replayed tickets, the hidden field and instant sign-ups are refused', async ({ browser }) => {
	const ip = '198.51.100.12';
	const { context, page } = await contextAt(browser, ip);
	const base = { email: 'bot2@example.com', password: 'a-long-password-1', confirmPassword: 'a-long-password-1', acceptTerms: 'on', ageConfirm: 'on' };

	const forged = await post(page.request, '/signup', { ...base, ticket: 'eyJhIjoic2lnbnVwIn0.forged' }, ip);
	expect(await forged.text()).toContain('The form could not be submitted.');

	// Sent within a moment of loading the page: refused, however complete the form is.
	await page.goto('/signup');
	const fast = await protectionFields(page);
	expect(await (await post(page.request, '/signup', { ...base, ...fast }, ip)).text()).toContain('The form could not be submitted.');
	// The same ticket again: already used.
	expect(await (await post(page.request, '/signup', { ...base, ...fast }, ip)).text()).toContain('The form could not be submitted.');

	await page.goto('/signup');
	await page.waitForTimeout(2700);
	const trap = await protectionFields(page);
	expect(await (await post(page.request, '/signup', { ...base, ...trap, website: 'http://spam.example' }, ip)).text()).toContain('The form could not be submitted.');
	await context.close();
});

test('a solved verification is accepted once, and only for the form it was issued to', async ({ browser }) => {
	const ip = '198.51.100.13';
	const { context, page } = await contextAt(browser, ip);
	await page.goto('/signin');
	await solve(page);
	const fields = await protectionFields(page);
	const creds = { email: `nobody-${Date.now()}@example.com`, password: 'wrong-password-123' };

	// First use: the verification passes and the (wrong) credentials are checked.
	expect(await (await post(page.request, '/signin', { ...creds, ...fields }, ip)).text()).toContain('The email address or password is incorrect.');
	// Replaying the identical request: the ticket, proof of work and challenge are all spent.
	const replay = await (await post(page.request, '/signin', { ...creds, ...fields }, ip)).text();
	expect(replay).not.toContain('The email address or password is incorrect.');
	expect(replay).toMatch(/Please complete the verification|did not match/);

	// A challenge solved on the sign-in page cannot be spent on registration.
	await page.goto('/signin');
	await solve(page);
	const forSignin = await protectionFields(page);
	await page.goto('/signup');
	await page.waitForTimeout(2700);
	const signupTicket = (await protectionFields(page)).ticket!;
	const pass = 'a-long-password-2';
	const cross = await post(page.request, '/signup', { ...forSignin, ticket: signupTicket, email: `cross-${Date.now()}@example.com`, password: pass, confirmPassword: pass, acceptTerms: 'on', ageConfirm: 'on' }, ip);
	expect(await cross.text()).toMatch(/did not match|Please complete the verification/);
	await context.close();
});

test('automated registration from one address is limited', async ({ request }) => {
	const ip = '198.51.100.14';
	const body = { email: 'loop@example.com', password: 'a-long-password', confirmPassword: 'a-long-password', acceptTerms: 'on', ageConfirm: 'on' };
	const texts: string[] = [];
	for (let i = 0; i < 7; i++) texts.push(await (await post(request, '/signup', body, ip)).text());
	expect(texts.slice(0, 5).every((t) => t.includes('could not be submitted'))).toBe(true);
	expect(texts.slice(5).every((t) => t.includes('Too many attempts'))).toBe(true);
});

test('credential stuffing from one address is limited, even without solving anything', async ({ request }) => {
	const ip = '198.51.100.15';
	let limited = 0;
	for (let i = 0; i < 24; i++) {
		const text = await (await post(request, '/signin', { email: `victim${i}@example.com`, password: `guess-${i}-password` }, ip)).text();
		if (text.includes('Too many attempts')) limited++;
	}
	expect(limited).toBeGreaterThanOrEqual(4);
});

test('the password reset form is protected in the same way', async ({ browser }) => {
	const ip = '198.51.100.16';
	const { context, page } = await contextAt(browser, ip);
	await page.goto('/reset-password');
	// Browsers under automation are shown the verification straight away.
	await expect(page.getByRole('group', { name: /Verification/ })).toBeVisible();
	await page.getByLabel('Email address').fill('someone@example.com');
	await page.getByLabel('Recovery code').fill('ABCD-EFGH-JKMN');
	await page.getByLabel('New password', { exact: true }).fill('a-long-password-3');
	await page.getByLabel('Confirm new password').fill('a-long-password-3');
	await solve(page);
	await page.waitForTimeout(1600);
	await page.getByRole('button', { name: 'Reset password' }).click();
	await expect(page.getByRole('alert')).toContainText('The email address or recovery code is incorrect.');
	await context.close();
});
