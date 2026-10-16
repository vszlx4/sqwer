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
	await page.getByRole('radio', { name: 'Words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	const words = await visibleWords(page);
	expect(words).toHaveLength(10);
	await page.keyboard.type(words.join(' '), { delay: 30 });
	await expect(page.getByTestId('result-acc')).toHaveText('100%');
	await expect(page.getByTestId('result-wpm')).toHaveText(/^\d+$/);
});

test('counts mistakes against accuracy', async ({ page }) => {
	await page.getByRole('radio', { name: 'Words' }).click();
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

test('the keyboard does not pre-highlight the next key', async ({ page }) => {
	await page.getByTestId('typing-input').focus();
	await expect(page.locator('svg[aria-label^="Keyboard"] rect[fill="var(--accent)"]')).toHaveCount(0);
});

test('time test ends on its own', async ({ page }) => {
	await page.getByRole('radio', { name: '15 seconds' }).click();
	await page.getByTestId('typing-input').focus();
	await page.keyboard.type('a');
	await expect(page.getByTestId('result-wpm')).toBeVisible({ timeout: 20_000 });
});

test('Tab restarts a test in progress with new words and records the attempt', async ({ page }) => {
	await page.getByTestId('typing-input').focus();
	const before = await visibleWords(page);
	await page.keyboard.type(before.slice(0, 2).join(' ') + ' ', { delay: 20 });
	await page.keyboard.press('Tab');
	await expect(page.getByTestId('counter')).toHaveText('30');
	expect(await visibleWords(page)).not.toEqual(before);
	await page.goto('/history');
	await expect(page.getByText('Not completed').first()).toBeVisible();
});

test('a words test ends on the last character even when it is wrong', async ({ page }) => {
	await page.getByRole('radio', { name: 'Words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	const words = await visibleWords(page);
	const last = words[words.length - 1]!;
	const wrongLast = 'x'.repeat(last.length);
	await page.keyboard.type([...words.slice(0, -1), wrongLast].join(' '), { delay: 15 });
	await expect(page.getByTestId('result-wpm')).toBeVisible();
	expect(Number((await page.getByTestId('result-acc').textContent())!.replace('%', ''))).toBeLessThan(100);
});

test('letters skipped with space are marked as missed', async ({ page }) => {
	await page.getByTestId('typing-input').focus();
	const words = await visibleWords(page);
	const first = words.find((w) => w.length >= 3) === words[0] ? words[0]! : words[0]!;
	await page.keyboard.type(first.slice(0, 1) + ' ');
	if (first.length > 1) await expect(page.locator('[data-word="0"] .missed')).toHaveCount(first.length - 1);
});

test('Tab on the results page starts a new test without deleting the result', async ({ page }) => {
	await page.getByRole('radio', { name: 'Words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	await page.keyboard.type((await visibleWords(page)).join(' '), { delay: 15 });
	await expect(page.getByRole('heading', { name: 'Word speed' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Replay' })).toBeVisible();
	await expect(page.getByRole('img', { name: /Speed, raw speed and accuracy/ })).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(page.getByTestId('typing-input')).toBeAttached();
	await expect(page.getByTestId('counter')).toHaveText('0/10');
	await page.goto('/history');
	await expect(page.getByRole('cell', { name: 'Completed' }).first()).toBeVisible();
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

test('a visitor without an account leaves no usage statistics or device identifier', async ({ page }) => {
	await page.getByRole('radio', { name: 'Words' }).click();
	await page.getByRole('radio', { name: '10 words' }).click();
	await page.getByTestId('typing-input').focus();
	await page.keyboard.type((await visibleWords(page)).join(' '), { delay: 20 });
	await expect(page.getByTestId('result-wpm')).toBeVisible();
	await page.waitForTimeout(500);

	expect(await page.evaluate(() => localStorage.getItem('sqwer:device'))).toBeNull();
	const usage = await page.evaluate(
		() =>
			new Promise((resolve) => {
				const open = indexedDB.open('sqwer', 1);
				open.onsuccess = () => {
					const req = open.result.transaction('kv').objectStore('kv').get('usage');
					req.onsuccess = () => resolve(req.result ?? null);
					req.onerror = () => resolve(null);
				};
				open.onerror = () => resolve(null);
			})
	);
	expect(usage).toBeNull();
});

test('the ranked test has its own display with live readouts that can be switched off', async ({ page }) => {
	await page.goto('/test?exam=timed');
	await expect(page.getByRole('link', { name: 'Play ranked' })).toBeVisible();

	await page.goto('/test?exam=competitive');
	await expect(page.getByText('Your rank')).toBeVisible();
	await expect(page.getByRole('timer')).toHaveAccessibleName('60 seconds left');
	const speed = page.getByRole('group', { name: 'Live readouts' }).getByRole('button', { name: 'Speed' });
	await expect(speed).toHaveAttribute('aria-pressed', 'true');
	await speed.click();
	await expect(speed).toHaveAttribute('aria-pressed', 'false');
	// The choice is remembered.
	await page.reload();
	await expect(page.getByRole('group', { name: 'Live readouts' }).getByRole('button', { name: 'Speed' })).toHaveAttribute('aria-pressed', 'false');
});
