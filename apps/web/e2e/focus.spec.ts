import { expect, test } from '@playwright/test';
import { proceed } from './play.ts';

/*
 * Space never scrolls a page, and a running exercise keeps the keyboard wherever the person clicks
 * (lib/ui/typing-focus.ts).
 */

// A short window, so every page here could scroll.
test.use({ viewport: { width: 1100, height: 520 } });

const scrollY = (page: import('@playwright/test').Page) => page.evaluate(() => window.scrollY);

test('in a lesson drill, Space types a space even after clicking a control, and never scrolls', async ({ page }) => {
	await page.goto('/learn/l001');
	await expect(page.getByText('Press F with your left index finger.')).toBeVisible();
	for (const k of 'fffjjj') await page.keyboard.press(k);
	await proceed(page);
	await page.waitForSelector('[data-word]');
	const words = await page.$$eval('[data-word]', (els) => els.map((e) => e.textContent ?? ''));

	// Clicking the hint checkbox toggles it, then the keyboard returns to the drill.
	const hint = page.getByRole('checkbox', { name: 'Show the next key' });
	const initially = await hint.isChecked();
	await hint.click();
	await expect(hint).toBeChecked({ checked: !initially });
	await expect(page.getByTestId('typing-input')).toBeFocused();

	const before = await scrollY(page);
	await page.keyboard.type(`${words[0]} `, { delay: 20 });
	await expect(page.locator('.status')).toContainText('1 / ');
	// Space was a space in the drill: the checkbox was not toggled back and the page did not move.
	await expect(hint).toBeChecked({ checked: !initially });
	expect(await scrollY(page)).toBe(before);

	// Clicking anywhere else on the page also returns the keyboard to the drill.
	await page.getByRole('heading', { level: 1 }).click();
	await page.keyboard.type(`${words[1]} `, { delay: 20 });
	await expect(page.locator('.status')).toContainText('2 / ');
	expect(await scrollY(page)).toBe(before);
});

test('in a game that listens to the whole page, a focused button does not take the keys', async ({ page }) => {
	await page.goto('/learn/l001');
	await expect(page.getByText('Press F with your left index finger.')).toBeVisible();
	// Focus a button as a click or Tab would, then use the keyboard.
	await page.getByRole('button', { name: 'Leave lesson' }).focus();
	await page.keyboard.press('Space');
	// Space went to the exercise: the button was not pressed (no leave dialog) and nothing scrolled.
	await expect(page.getByRole('alertdialog')).toHaveCount(0);
	expect(await scrollY(page)).toBe(0);
	await page.getByRole('button', { name: 'Leave lesson' }).focus();
	for (const k of 'fff') await page.keyboard.press(k);
	await expect(page.getByText('Press J with your right index finger.')).toBeVisible();
});

test('in the typing test, typing reaches the test after a click anywhere', async ({ page }) => {
	await page.goto('/test');
	const input = page.getByTestId('typing-input');
	await expect(input).toBeFocused();
	await page.locator('main').click({ position: { x: 5, y: 5 } });
	await expect(input).toBeFocused();
	const first = (await page.locator('[data-word]').first().textContent())!;
	const before = await scrollY(page);
	await page.keyboard.type(`${first} `, { delay: 20 });
	await expect(page.locator('[data-word]').first().locator('.correct').first()).toBeVisible();
	expect(await scrollY(page)).toBe(before);
});

test('on ordinary pages Space does not scroll, but still presses a focused button', async ({ page }) => {
	await page.goto('/privacy');
	await page.locator('h1').click();
	await page.keyboard.press('Space');
	await page.keyboard.press('Space');
	expect(await scrollY(page)).toBe(0);
	// Other ways of scrolling are unaffected.
	await page.keyboard.press('PageDown');
	await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
	// A focused button still works with Space.
	await page.getByRole('button', { name: 'Analytics preferences' }).focus();
	await page.keyboard.press('Space');
	await expect(page.getByRole('region', { name: 'Can sqwer count your visit?' })).toBeVisible();
});
