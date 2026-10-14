import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function promptText(page: Page) {
	const label = await page.locator('.prompt').getAttribute('aria-label');
	return label!.replace(/^Prompt: /, '');
}

/** Type and tag `count` characters of the current prompt with finger `digit`. */
async function tagChars(page: Page, count: number, digit = '4') {
	for (let n = 0; n < count; n++) {
		const prompt = await promptText(page);
		const i = await page.locator('.ch.current').evaluate((el) => [...el.parentElement!.children].indexOf(el));
		const ch = prompt[i]!;
		if (/[A-Z]/.test(ch)) {
			await page.keyboard.down('Shift');
			await page.keyboard.press(ch);
			await page.keyboard.up('Shift');
			await page.keyboard.press(digit);
			await page.keyboard.press('0');
		} else {
			await page.keyboard.press(ch === ' ' ? 'Space' : ch);
			await page.keyboard.press(digit);
		}
		// New prompts arrive after a short pause.
		await page.waitForTimeout(ch === prompt[prompt.length - 1] && i === prompt.length - 1 ? 450 : 10);
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/map');
	await page.evaluate(() => new Promise((r) => { const req = indexedDB.deleteDatabase('sqwer'); req.onsuccess = req.onerror = req.onblocked = () => r(null); }));
	await page.reload();
});

test('maps fingers, saves them, and exports a valid profile', async ({ page }) => {
	await expect(page.getByRole('heading', { name: 'Your finger map' })).toBeVisible();
	await page.getByTestId('start-mapping').click();
	await expect(page.locator('.ch.current')).toBeVisible();

	await tagChars(page, 12);
	await expect(page.locator('.meta')).toContainText(/new entr/);

	await page.keyboard.press('Escape');
	await expect(page).toHaveURL(/\/map\?saved=\d+/);
	await expect(page.getByRole('status')).toContainText('saved to your finger map');

	await page.reload();
	await expect(page.getByText('Entries recorded')).toBeVisible();

	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export profile' }).click();
	const file = await (await download).path();
	const json = JSON.parse(await readFile(file, 'utf8'));
	expect(json.format).toBe('sqwer-fingers');
	expect(json.observations.length).toBeGreaterThanOrEqual(12);
});

test('wrong keys are not tagged and backspace undoes a tag', async ({ page }) => {
	await page.goto('/map/session');
	await expect(page.locator('.ch.current')).toBeVisible();
	const prompt = await promptText(page);
	const wrong = prompt[0] === 'q' ? 'z' : 'q';
	await page.keyboard.press(wrong);
	await expect(page.getByRole('alert')).toContainText('Please type');

	await tagChars(page, 2);
	await expect(page.locator('.meta')).toContainText(/[1-9]\d* new entr/);
	const before = await page.locator('.ch.done').count();
	await page.keyboard.press('Backspace');
	await expect(page.locator('.ch.done')).toHaveCount(before - 1);
});


test('picks a finger by clicking it on the hands', async ({ page }) => {
	await page.getByTestId('start-mapping').click();
	await expect(page.locator('.ch.current')).toBeVisible();
	const prompt = await promptText(page);
	const ch = prompt[0]!;
	const fingers = page.locator('.session .hands path.finger');
	await expect(fingers).toHaveCount(10);

	if (/[A-Z]/.test(ch)) {
		await page.keyboard.down('Shift');
		await page.keyboard.press(ch);
		await page.keyboard.up('Shift');
		await fingers.nth(3).click(); // left index
		await fingers.nth(9).click(); // right little finger on Shift
	} else {
		await page.keyboard.press(ch === ' ' ? 'Space' : ch);
		await fingers.nth(3).click(); // left index
	}
	await expect(page.locator('.meta')).toContainText(/[12] new entr/);
	await expect(page.locator('.ch').first()).toHaveClass(/done/);
});
