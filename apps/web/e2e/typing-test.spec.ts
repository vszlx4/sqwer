import { expect, test, type Page } from '@playwright/test';

async function visibleWords(page: Page) {
	return page.$$eval('[data-word]', (els) => els.map((e) => e.textContent ?? ''));
}

test.beforeEach(async ({ page }) => {
	await page.goto('/test');
	await page.evaluate(() => localStorage.clear());
	await page.reload();
});

test('completes a words test with perfect accuracy', async ({ page }) => {
	await page.getByRole('radio', { name: 'words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	const words = await visibleWords(page);
	expect(words).toHaveLength(10);
	await page.keyboard.type(words.join(' '), { delay: 30 });
	await expect(page.getByTestId('result-acc')).toHaveText('100%');
	await expect(page.getByTestId('result-wpm')).toHaveText(/^\d+$/);
});

test('counts mistakes against accuracy', async ({ page }) => {
	await page.getByRole('radio', { name: 'words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	const words = await visibleWords(page);
	const first = words[0]!;
	const wrong = first[0] === 'q' ? 'z' : 'q';
	await page.keyboard.type(wrong);
	await page.keyboard.press('Backspace');
	await page.keyboard.type(words.join(' '), { delay: 20 });
	const acc = Number((await page.getByTestId('result-acc').textContent())!.replace('%', ''));
	expect(acc).toBeLessThan(100);
});

test('highlights the next key and the finger to use', async ({ page }) => {
	await page.getByTestId('typing-input').focus();
	const first = (await visibleWords(page))[0]!;
	const label = page.getByRole('img', { name: /^Keyboard guide: press/ });
	await expect(label).toHaveAttribute('aria-label', new RegExp(`press ${first[0]!.toUpperCase()} with your (left|right) (pinky|ring|middle|index)`));
});

test('time test ends on its own', async ({ page }) => {
	await page.getByRole('radio', { name: '15 seconds' }).click();
	await page.getByTestId('typing-input').focus();
	await page.keyboard.type('a');
	await expect(page.getByTestId('result-wpm')).toBeVisible({ timeout: 20_000 });
});

test('escape restarts with fresh words', async ({ page }) => {
	await page.getByTestId('typing-input').focus();
	const before = await visibleWords(page);
	await page.keyboard.type(before[0]!);
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('counter')).toHaveText('30');
	expect(await visibleWords(page)).not.toEqual(before);
});

test('the light theme is the default and the theme choice persists', async ({ page }) => {
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await page.getByRole('radio', { name: 'Dark theme' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.getByRole('radio', { name: 'Use the system theme' }).click();
	await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
});
