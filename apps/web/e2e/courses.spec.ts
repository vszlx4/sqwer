import { expect, test } from '@playwright/test';
import { playEcho, playKeyHunt, proceed, typeDrill } from './play.ts';

test('a guest can take the whole first lesson and is invited to keep it', async ({ page }) => {
	test.setTimeout(180_000);
	await page.goto('/learn/l001');
	await expect(page.getByRole('heading', { level: 1, name: 'F and J' })).toBeVisible();
	await expect(page.getByText('Press F with your left index finger.')).toBeVisible();

	// A wrong key is explained, not counted.
	await page.keyboard.press('k');
	await expect(page.getByRole('alert')).toContainText('That was K. Find F');
	for (const k of 'fffjjj') await page.keyboard.press(k);
	await proceed(page);

	await expect(page.getByRole('heading', { name: 'Get to know F and J' })).toBeVisible();
	await expect(page.getByText('Step 2 of 5')).toBeVisible();
	await typeDrill(page);
	await proceed(page);

	await expect(page.locator('.overlay .title')).toHaveText('Key hunt');
	await playKeyHunt(page);
	await proceed(page);

	await expect(page.locator('.overlay .title')).toHaveText('Echo');
	await playEcho(page);
	await proceed(page);

	await expect(page.locator('.overlay .title')).toHaveText('Key hunt');
	await playKeyHunt(page);
	await proceed(page);

	await expect(page.getByText('Lesson 1 complete')).toBeVisible();
	await expect(page.getByRole('img', { name: /of 3 stars/ })).toBeVisible();
	await expect(page.locator('#content').getByRole('link', { name: 'Create an account' })).toBeFocused();
});

test('later lessons need an account, but show what they teach', async ({ page }) => {
	await page.goto('/learn');
	await page.getByRole('link', { name: /Lesson 3: D and K/ }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'D and K' })).toBeVisible();
	await expect(page.getByText('New keys:')).toContainText('D and K');
	await expect(page.getByRole('link', { name: 'Create a free account' })).toBeVisible();
});

test('the course offers three ways to start, and chapters say who they suit', async ({ page }) => {
	await page.goto('/learn');
	await expect(page.getByRole('heading', { name: 'From your first two keys to fluent typing.' })).toBeVisible();
	for (const name of ['Start from the beginning', 'Choose a chapter', 'Find my level']) {
		await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
	}
	await page.getByRole('link', { name: /Choose a chapter/ }).click();
	await expect(page.getByRole('button', { name: /^Start here: chapter \d+,/ })).toHaveCount(12);
	await expect(page.getByText('Suits you if: You can type the home row without looking at the keyboard.')).toBeVisible();

	await page.getByRole('button', { name: 'Start here: chapter 2, Reaching up' }).click();
	await expect(page).toHaveURL(/\/learn\/l\d+$/);
	await expect(page.getByRole('heading', { level: 1, name: 'E and I' })).toBeVisible();
});

test('leaving a lesson part-way asks for confirmation', async ({ page }) => {
	await page.goto('/learn/l001');
	await expect(page.getByText('Press F with your left index finger.')).toBeVisible();
	for (const k of 'fffjjj') await page.keyboard.press(k);
	await expect(page.locator('.outcome')).toBeVisible();
	await page.getByRole('button', { name: 'Leave lesson' }).click();
	const dialog = page.getByRole('alertdialog', { name: 'Leave this lesson?' });
	await expect(dialog).toBeVisible();
	await dialog.getByRole('button', { name: 'Keep going' }).click();
	await expect(dialog).toBeHidden();
	await page.getByRole('button', { name: 'Leave lesson' }).click();
	await page.getByRole('alertdialog').getByRole('link', { name: 'Leave lesson' }).click();
	await expect(page).toHaveURL(/\/learn$/);
});

test('Tab restarts only the current exercise', async ({ page }) => {
	await page.goto('/learn/l001');
	await expect(page.getByText('Press F with your left index finger.')).toBeVisible();
	for (const k of 'fffjjj') await page.keyboard.press(k);
	await proceed(page);

	await page.waitForSelector('[data-word]');
	await expect(page.getByTestId('typing-input')).toBeFocused();
	await page.keyboard.type('fff jjj ', { delay: 20 });
	await expect(page.locator('.status')).toContainText('2 / 10');
	await expect(page.locator('[data-word] .correct').first()).toBeVisible();

	await page.keyboard.press('Tab');
	// The drill starts again with nothing typed; the completed introduction stays completed.
	await expect(page.locator('.status')).toContainText('0 / 10');
	await expect(page.locator('[data-word] .correct')).toHaveCount(0);
	await expect(page.getByTestId('typing-input')).toBeFocused();
	await expect(page.getByRole('list', { name: 'Lesson steps' }).getByRole('listitem').first()).toHaveClass(/done/);
	await expect(page.getByRole('heading', { name: 'Get to know F and J' })).toBeVisible();
});
