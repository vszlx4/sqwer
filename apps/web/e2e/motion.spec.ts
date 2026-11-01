import { expect, test, type Page } from '@playwright/test';

/* Entrances on lib/motion: nothing stays hidden under reduced motion, and client-side entrances finish clean. */

/** Elements in main left below full opacity or holding inline motion styles. */
function hidden(page: Page) {
	return page.locator('main').evaluate((main) =>
		[...main.querySelectorAll<HTMLElement>('header, section, article, li, .detail, .detail-head')]
			.filter((el) => getComputedStyle(el).opacity !== '1' || el.style.opacity || el.style.transform)
			.map((el) => el.className || el.tagName)
	);
}

test.describe('reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });

	for (const path of ['/learn', '/exams', '/competitive']) {
		test(`${path} shows everything without scrolling`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			expect(await hidden(page)).toEqual([]);
		});
	}

	test('client-side views and chapter swaps appear at once', async ({ page }) => {
		await page.goto('/exams');
		await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Learning path' }).click();
		await expect(page).toHaveURL(/\/learn$/);
		await page.getByRole('button', { name: /Reaching up/ }).click();
		await expect(page.locator('.detail-head')).toContainText('Reaching up');
		expect(await hidden(page)).toEqual([]);
	});
});

test('server-rendered views are left as rendered', async ({ page }) => {
	await page.goto('/learn');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	expect(await hidden(page)).toEqual([]);
});

test('client-side entrances finish at full opacity with no inline styles left', async ({ page }) => {
	await page.goto('/exams');
	await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Learning path' }).click();
	await expect(page).toHaveURL(/\/learn$/);
	await page.getByRole('button', { name: /Reaching up/ }).click();
	await expect(page.locator('.detail-head')).toContainText('Reaching up');
	await expect.poll(() => hidden(page), { timeout: 5_000 }).toEqual([]);
});
