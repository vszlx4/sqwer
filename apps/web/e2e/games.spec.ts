import { expect, test } from '@playwright/test';
import { playFalling } from './play.ts';

test('endless games are listed in practice and play round after round at the chosen difficulty', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/exams');
	const games = page.locator('#games');
	await expect(games.getByRole('heading', { name: 'Games, endless' })).toBeVisible();
	await expect(games.getByRole('link')).toHaveCount(7);
	await games.getByRole('link', { name: /Falling words/ }).click();
	await expect(page).toHaveURL(/\/play\/falling-words$/);

	// The difficulty is chosen before the run starts.
	await expect(page.getByRole('heading', { name: 'Choose the difficulty' })).toBeVisible();
	await page.locator('.choice', { hasText: 'Gentle' }).click();
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
