import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { playFalling } from './play.ts';

test('endless games are listed in practice and play round after round at the chosen difficulty', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/exams');
	const games = page.locator('#games');
	await expect(games.getByRole('heading', { name: 'Endless games' })).toBeVisible();
	await expect(games.getByRole('link')).toHaveCount(6);
	await games.getByRole('link', { name: /Falling words/ }).click();
	await expect(page).toHaveURL(/\/play\/falling-words$/);

	// The difficulty is chosen before the run starts.
	await expect(page.getByRole('heading', { name: 'Difficulty', exact: true })).toBeVisible();
	await page.locator('.level', { hasText: 'Gentle' }).click();
	await expect(page.getByRole('radio', { name: /Gentle/ })).toBeChecked();
	await page.getByRole('button', { name: 'Start at level 2' }).click();
	await expect(page.locator('.hud')).toContainText('Gentle');

	await playFalling(page);
	await expect(page.getByRole('heading', { name: 'Round 1 cleared' })).toBeVisible();
	await expect(page.getByText('Next round: level 2.')).toBeVisible();

	// Ending the run shows the totals and keeps the best score.
	await page.getByRole('button', { name: 'End the run' }).click();
	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
	await expect(page.locator('.totals')).toContainText('Score2');
	await page.goto('/exams');
	await expect(page.locator('#games').getByRole('link', { name: /Falling words/ })).toContainText('Best 2');
});

test('an unknown game is not found', async ({ page }) => {
	const res = await page.goto('/play/chess');
	expect(res?.status()).toBe(404);
});

test('Listen and type: endless words, the explanation in place, Stop with statistics', async ({ page }) => {
	await page.goto('/play/listen');
	await page.getByRole('button', { name: /Start at level/ }).click();

	// Endless: no ready screen, count-in, goal or tries.
	const input = page.getByTestId('listen-input');
	await expect(input).toBeEnabled();
	await expect(input).toBeFocused();
	await expect(page.getByText(/Type \d of \d words correctly/)).toHaveCount(0);
	await expect(page.locator('.hud')).not.toContainText('Tries');
	await expect(page.getByRole('list', { name: 'Word 1' })).toBeVisible();
	// Offset inside the stage, so the scroll that brings the game into view does not count.
	const offset = () => page.locator('.footer .act').evaluate((el) => el.getBoundingClientRect().top - el.closest('.stage')!.getBoundingClientRect().top);
	const before = await offset();
	await page.keyboard.type('zqzq');
	await page.keyboard.press('Enter');

	// The explanation waits for Continue, and swaps in place: nothing below moves.
	await expect(page.locator('#listen-grade')).toContainText('Not quite');
	await expect(page.getByRole('status').filter({ hasText: 'You typed z q z q. The word is' })).toHaveCount(1);
	await expect(page.locator('.result .word')).not.toBeEmpty();
	expect(await offset()).toBe(before);
	const next = page.getByRole('button', { name: 'Continue' });
	await expect(next).toBeFocused();
	const axe = await new AxeBuilder({ page }).include('main').analyze();
	expect(axe.violations).toEqual([]);

	await page.keyboard.press('Enter');
	await expect(page.getByRole('list', { name: 'Word 2' })).toBeVisible();
	await expect(input).toBeFocused();
	await expect(page.locator('.marks .status-mark').first()).toHaveAttribute('data-status', 'failed');
	await expect(page.locator('.hud')).toContainText('Words1');

	await page.getByRole('button', { name: 'Stop' }).click();
	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Words to practice' })).toBeVisible();
	await expect(page.getByText('you typed zqzq')).toBeVisible();
});
