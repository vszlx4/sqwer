import { expect, test, type Page } from '@playwright/test';
import { playFalling, playRace, proceed, typeDrill } from './play.ts';

test.describe.configure({ mode: 'serial' });

const email = `typist-${Date.now()}@example.com`;
const password = 'correct-horse-battery';
const newPassword = 'another-long-passphrase';
let codes: string[] = [];

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

/** Answers a verification text question, as a person using a screen reader would. */
export function answerQuestion(question: string): string {
	let m = question.match(/the (\w+) letter of the word “(\w+)”/);
	if (m) return m[2]![ORDINALS.indexOf(m[1]!)]!;
	m = question.match(/What is (\w+) plus (\w+)\?/);
	if (m) return String(NUMBERS.indexOf(m[1]!) + NUMBERS.indexOf(m[2]!));
	m = question.match(/last word in this list: (.+)\./);
	if (m) return m[1]!.split(', ').at(-1)!;
	throw new Error(`Unknown question: ${question}`);
}

/** Completes the verification using its text question, and waits for the background check to finish. */
async function solveCaptcha(page: Page, answer?: string) {
	const toText = page.getByRole('button', { name: 'Use a text question' });
	if (await toText.isVisible()) await toText.click();
	const question = page.locator('.captcha .question');
	await expect(question).toHaveText(/\?|\.$/);
	const text = (await question.textContent())!.trim();
	await page.getByRole('textbox', { name: 'Your answer' }).fill(answer ?? answerQuestion(text));
	await expect.poll(async () => page.locator('input[name="altcha"]').inputValue(), { timeout: 30_000 }).not.toBe('');
}

/** Submits a form and waits for the server's response, so later steps see the new state. */
async function submit(page: Page, name: string) {
	await Promise.all([
		page.waitForResponse((r) => r.request().method() === 'POST'),
		page.getByRole('button', { name }).click()
	]);
}

test('creates an account, shows recovery codes and builds the profile', async ({ page }) => {
	await page.goto('/signup');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel('Confirm password').fill(password);
	await page.getByLabel(/I accept the Terms and Conditions/).check();
	await page.getByLabel(/at least 16 years old/).check();
	await solveCaptcha(page);
	await page.waitForTimeout(2600); // the form rejects submissions faster than a person could type
	await page.getByRole('button', { name: 'Create account' }).click();

	await expect(page.getByRole('heading', { name: 'Your account has been created' })).toBeVisible();
	codes = await page.locator('ol[aria-label="Recovery codes"] code').allTextContents();
	expect(codes).toHaveLength(8);

	await page.getByRole('link', { name: 'Continue to profile setup' }).click();
	await expect(page).toHaveURL(/\/account\/setup$/);
	await page.getByRole('textbox', { name: 'Display name' }).fill('Test Typist');
	await page.getByRole('textbox', { name: 'Username' }).fill(`typist_${Date.now() % 100000}`);
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByText('Proficient', { exact: true }).click();
	await page.getByText('Accuracy', { exact: true }).click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByText('PC keyboard').click();
	await page.getByRole('button', { name: 'Continue' }).click();
	await page.getByLabel(/Make my profile public/).check();
	await page.getByRole('button', { name: 'Complete setup' }).click();

	await expect(page).toHaveURL(/\/account\?welcome=1$/);
	await expect(page.getByRole('heading', { level: 1, name: 'Test Typist' })).toBeVisible();
	await expect(page.getByText('Your profile is complete.')).toBeVisible();
});

test('signs out and signs back in', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill('wrong-password-123');
	await solveCaptcha(page);
	await submit(page, 'Sign in');
	await expect(page.getByRole('alert')).toContainText('The email address or password is incorrect.');

	await page.getByLabel('Password').fill(password);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);

	// Signing out asks for confirmation; cancelling keeps the session.
	await page.getByRole('button', { name: /Account menu/ }).click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	const dialog = page.getByRole('alertdialog', { name: 'Sign out of sqwer?' });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Stay signed in' })).toBeFocused();
	await dialog.getByRole('button', { name: 'Stay signed in' }).click();
	await expect(dialog).toBeHidden();
	await page.reload();
	await expect(page).toHaveURL(/\/account$/);

	await page.getByRole('button', { name: /Account menu/ }).click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'Sign out' }).click();
	await expect(page).toHaveURL(/\/signin\?signedOut=1$/);
	await expect(page.getByText('You have been signed out.')).toBeVisible();
});

test('resets the password with a recovery code, which then cannot be reused', async ({ page }) => {
	await page.goto('/reset-password');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Recovery code').fill(codes[0]!);
	await page.getByLabel('New password', { exact: true }).fill(newPassword);
	await page.getByLabel('Confirm new password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Reset password' }).click();
	await expect(page).toHaveURL(/\/account\/security\?reset=1$/);
	await expect(page.getByText('7 of 8')).toBeVisible();
	await expect(page.getByText('Password reset with a recovery code')).toBeVisible();

	await page.context().clearCookies();
	await page.goto('/reset-password');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Recovery code').fill(codes[0]!);
	await page.getByLabel('New password', { exact: true }).fill(password);
	await page.getByLabel('Confirm new password').fill(password);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Reset password' }).click();
	await expect(page.getByRole('alert')).toContainText('The email address or recovery code is incorrect.');
});


test('uploads a profile picture, which then appears on the public profile', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);

	await page.goto('/account/profile');
	// Draw a real PNG in the browser to use as the upload.
	const dataUrl = await page.evaluate(() => {
		const c = document.createElement('canvas');
		c.width = 320;
		c.height = 240;
		const g = c.getContext('2d')!;
		g.fillStyle = '#ccf900';
		g.fillRect(0, 0, 320, 240);
		return c.toDataURL('image/png');
	});
	const PNG = Buffer.from(dataUrl.split(',')[1]!, 'base64');
	await page.locator('#pfp-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
	// The upload is refused until the uploader confirms they hold the rights to the image.
	await page.getByRole('button', { name: 'Save picture' }).click();
	await expect(page.getByRole('alert')).toContainText('Confirm that you hold the rights to this image');
	await page.getByLabel(/I took or created this image/).check();
	await page.getByRole('button', { name: 'Save picture' }).click();
	await expect(page.getByText('Your profile picture has been saved.')).toBeVisible();
	await expect(page.locator('img.photo').first()).toHaveAttribute('src', /\/avatars\//);

	// Files that are not images are refused by the server even if renamed.
	const res = await page.request.post('/account/profile?/avatar', {
		multipart: { avatar: { name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<svg onload=alert(1)>') }, rightsConfirm: 'on' },
		headers: { origin: 'http://localhost:4321' }
	});
	expect(await res.text()).toContain('Upload a PNG, JPEG or WebP image.');

	// The server also requires the confirmation, whatever the browser sends.
	const unconfirmed = await page.request.post('/account/profile?/avatar', {
		multipart: { avatar: { name: 'me.png', mimeType: 'image/png', buffer: PNG } },
		headers: { origin: 'http://localhost:4321' }
	});
	expect(await unconfirmed.text()).toContain('Confirm that you hold the rights to this image');
});

test('the public profile is visible and the email address is not', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);
	await page.getByRole('link', { name: 'View public profile' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Test Typist' })).toBeVisible();
	await expect(page.locator('img.photo').first()).toBeVisible();
	await expect(page.locator('body')).not.toContainText(email);
});

test('saves usage statistics to the account and shows them on the statistics page', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);

	await page.goto('/test?exam=words');
	await page.getByTestId('typing-input').focus();
	const words = await page.$$eval('[data-word]', (els) => els.map((e) => e.textContent));
	await page.keyboard.type(words.join(' '), { delay: 20 });
	await expect(page.getByTestId('result-wpm')).toBeVisible();

	const saved = page.waitForResponse((r) => r.url().endsWith('/api/usage') && r.request().method() === 'PUT');
	await page.goto('/account/statistics');
	expect((await saved).status()).toBe(200);

	const res = await page.request.get('/api/usage');
	const { usage, devices } = await res.json();
	// Each earlier test signed in from a fresh browser, which counts as its own device.
	expect(devices).toBeGreaterThanOrEqual(1);
	expect(usage.tests.completed).toBe(1);
	expect(usage.typing.words).toBe(words.length);
	await expect(page.getByText(`recorded across ${devices} ${devices > 1 ? 'devices' : 'device'} since`)).toBeVisible();
});

test('a completed course lesson is saved and earns points towards the next rank', async ({ page }) => {
	test.setTimeout(150_000);
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);

	await page.goto('/learn/start');
	await page.getByRole('button', { name: 'Start chapter 4: Capital letters' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Right Shift' })).toBeVisible();
	for (let i = 0; i < 3; i++) await page.keyboard.press('ShiftRight');
	await proceed(page);
	await typeDrill(page);
	await proceed(page);
	await playFalling(page);
	await proceed(page);
	await typeDrill(page);
	await proceed(page);
	await playRace(page);
	await page.locator('.outcome').getByRole('button', { name: 'See your result' }).click();

	await expect(page.getByText(/\+\d+ points/)).toBeVisible();

	await page.goto('/learn');
	await expect(page.getByRole('heading', { name: 'Novice' })).toBeVisible();
	await expect(page.getByRole('progressbar', { name: 'Progress to Learner' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Lesson \d+: Right Shift, \d of 3 stars/ })).toBeVisible();
	// The chosen start is kept: the next lesson continues chapter 4.
	await expect(page.locator('section.next')).toContainText('Left Shift');

	// Course points count towards the account level, which ranks the level leaderboard.
	await page.goto('/competitive?by=level');
	await expect(page.getByRole('heading', { level: 1, name: 'One minute. Your best speed.' })).toBeVisible();
	const row = page.locator('.row', { hasText: 'Test Typist' });
	await expect(row).toBeVisible();
	await expect(row).toContainText(/Level \d+/);
	await expect(row.getByRole('link')).toHaveAttribute('href', /\/u\//);
});

test('exports the account data and deletes the account', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/account$/);
	await page.goto('/account/data');

	const download = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Download my data' }).click();
	const data = JSON.parse(await (await (await download).createReadStream()).toArray().then((c) => Buffer.concat(c).toString()));
	expect(data.account.email).toBe(email);
	expect(data.profile.displayName).toBe('Test Typist');
	expect(data.acceptance.termsVersion).toMatch(/^terms-[\d.]+\+privacy-[\d.]+$/);
	expect(Date.parse(data.acceptance.termsAcceptedAt)).toBeGreaterThan(0);

	await page.getByRole('button', { name: 'Delete my account' }).click();
	await page.getByLabel('Password').fill(newPassword);
	await page.getByLabel('Type DELETE to confirm').fill('DELETE');
	await page.getByRole('button', { name: 'Permanently delete my account' }).click();
	await expect(page).toHaveURL(/\/signin\?deleted=1$/);
	await expect(page.getByText('Your account and its data have been deleted.')).toBeVisible();
});

test('rejects a wrong verification answer and shows a new challenge', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(newPassword);
	await solveCaptcha(page, 'definitely-wrong');
	await submit(page, 'Sign in');
	await expect(page.getByRole('alert')).toContainText('The answer did not match');
	await expect(page).toHaveURL(/\/signin$/);
	await expect(page.getByRole('textbox', { name: 'Your answer' })).toHaveValue('');
});

test('locks sign-in after five failed attempts', async ({ page }) => {
	for (const target of [`locked-${Date.now()}@example.com`]) {
		await page.goto('/signin');
		for (let i = 0; i < 5; i++) {
			await page.getByLabel('Email address').fill(target);
			await page.getByLabel('Password').fill(`wrong-${i}-password`);
			await solveCaptcha(page);
			await submit(page, 'Sign in');
			await expect(page.getByRole('alert')).toContainText('The email address or password is incorrect.');
		}
		await page.getByLabel('Email address').fill(target);
		await page.getByLabel('Password').fill('any-password-at-all');
		await solveCaptcha(page);
		await submit(page, 'Sign in');
		await expect(page.getByRole('alert')).toContainText('Too many attempts.');
	}
});

test('rejects bot submissions and protected pages require sign-in', async ({ page, request }) => {
	await page.goto('/account/security');
	await expect(page).toHaveURL(/\/signin\?redirectTo=%2Faccount%2Fsecurity$/);

	// A direct POST without the verification payload is refused.
	const res = await request.post('/signin', {
		form: { email, password: newPassword },
		headers: { origin: 'http://localhost:4321' }
	});
	expect(await res.text()).toContain('Please complete the verification.');
});
