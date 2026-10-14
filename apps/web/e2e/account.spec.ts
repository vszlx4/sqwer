import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const email = `typist-${Date.now()}@example.com`;
const password = 'correct-horse-battery';
const newPassword = 'another-long-passphrase';
let codes: string[] = [];

/** Starts the proof-of-work check and waits until the widget has produced a payload. */
async function solveCaptcha(page: Page) {
	// The checkbox is styled with an overlaid tick, so it is clicked directly.
	await page.locator('altcha-widget input[type="checkbox"]').click({ force: true });
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

	await page.getByRole('navigation', { name: 'Account sections' }).getByRole('button', { name: 'Sign out' }).click();
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
	await page.getByRole('button', { name: 'Save picture' }).click();
	await expect(page.getByText('Your profile picture has been saved.')).toBeVisible();
	await expect(page.locator('img.photo').first()).toHaveAttribute('src', /\/avatars\//);

	// Files that are not images are refused by the server even if renamed.
	const res = await page.request.post('/account/profile?/avatar', {
		multipart: { avatar: { name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<svg onload=alert(1)>') } },
		headers: { origin: 'http://localhost:4321' }
	});
	expect(await res.text()).toContain('Upload a PNG, JPEG or WebP image.');
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

	await page.getByRole('button', { name: 'Delete my account' }).click();
	await page.getByLabel('Password').fill(newPassword);
	await page.getByLabel('Type DELETE to confirm').fill('DELETE');
	await page.getByRole('button', { name: 'Permanently delete my account' }).click();
	await expect(page).toHaveURL(/\/signin\?deleted=1$/);
	await expect(page.getByText('Your account and its data have been deleted.')).toBeVisible();
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
