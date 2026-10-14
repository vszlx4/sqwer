import { expect, test, type Page } from '@playwright/test';

/** Types the visible words until the test finishes. */
async function typeUntilDone(page: Page, done: () => Promise<boolean>) {
	while (!(await done())) {
		const words = await page.$$eval('[data-word]', (els) =>
			els.filter((e) => !e.querySelector('.correct, .incorrect')).slice(0, 8).map((e) => e.textContent ?? '')
		);
		if (!words.length) break;
		await page.keyboard.type(words.join(' ') + ' ', { delay: 25 });
	}
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.evaluate(
		() =>
			new Promise((r) => {
				const req = indexedDB.deleteDatabase('sqwer');
				req.onsuccess = req.onerror = req.onblocked = () => r(null);
			})
	);
});

test('the placement test feeds the journey, results guidance and examination statistics', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/journey');
	await expect(page.getByText('0 of 4 steps completed')).toBeVisible();
	await page.getByRole('link', { name: 'Take the placement test' }).click();
	await expect(page).toHaveURL(/exam=placement/);
	await expect(page.getByText('Establishes your starting speed')).toBeVisible();

	await page.getByTestId('typing-input').focus();
	await typeUntilDone(page, async () => (await page.getByTestId('result-wpm').count()) > 0);

	await expect(page.getByRole('heading', { name: 'What this result shows' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Map your technique' })).toBeVisible();

	await page.goto('/exams');
	const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Placement test' }) });
	await expect(card.getByText('Attempts')).toBeVisible();

	await page.goto('/journey');
	await expect(page.getByText('1 of 4 steps completed')).toBeVisible();
});

const CORE: [string, string][] = [
	['KeyQ', 'lp'], ['KeyA', 'lp'], ['KeyZ', 'lp'], ['KeyW', 'lr'], ['KeyS', 'lr'], ['KeyX', 'lr'],
	['KeyE', 'lm'], ['KeyD', 'lm'], ['KeyC', 'lm'], ['KeyR', 'li'], ['KeyF', 'li'], ['KeyV', 'li'],
	['KeyT', 'li'], ['KeyG', 'li'], ['KeyB', 'li'], ['KeyY', 'ri'], ['KeyH', 'ri'], ['KeyN', 'ri'],
	['KeyU', 'ri'], ['KeyJ', 'ri'], ['KeyM', 'ri'], ['KeyI', 'rm'], ['KeyK', 'rm'], ['Comma', 'rm'],
	['KeyO', 'rr'], ['KeyL', 'rr'], ['Period', 'rr'], ['KeyP', 'rp'], ['Semicolon', 'rp'], ['Quote', 'rp'],
	['Slash', 'rp'], ['Space', 'rt']
];

test('the finger speed assessment unlocks with a mapped finger map and shows per-finger results', async ({ page }) => {
	test.setTimeout(180_000);
	await page.goto('/exams/finger-speed');
	await expect(page.getByText('Your finger map is not ready yet')).toBeVisible();

	// Seed a complete finger map, as if the typist had mapped every core key three times.
	await page.evaluate(async (core) => {
		const observations = core.flatMap(([code, finger], i) =>
			[0, 1, 2].map((n) => ({ code, prev: null, next: null, finger, at: i * 10 + n + 1 }))
		);
		await new Promise((resolve, reject) => {
			const open = indexedDB.open('sqwer', 1);
			open.onupgradeneeded = () => open.result.createObjectStore('kv');
			open.onsuccess = () => {
				const tx = open.result.transaction('kv', 'readwrite');
				tx.objectStore('kv').put(observations, 'finger-observations');
				tx.oncomplete = () => {
					open.result.close();
					resolve(null);
				};
				tx.onerror = () => reject(tx.error);
			};
		});
	}, CORE);
	await page.reload();

	await page.getByRole('button', { name: 'Begin the assessment' }).click();
	for (let stage = 1; stage <= 4; stage++) {
		await expect(page.getByText(`Stage ${stage} of 4`)).toBeVisible();
		const deadline = Date.now() + 22_000;
		while (Date.now() < deadline && (await page.getByText(`Stage ${stage} of 4`).count())) {
			const words = await page.$$eval('[data-word]', (els) =>
				els.filter((e) => !e.querySelector('.correct, .incorrect')).slice(0, 4).map((e) => e.textContent ?? '')
			);
			await page.keyboard.type(words.join(' ') + ' ', { delay: 30 });
		}
		if (stage < 4) await page.getByRole('button', { name: `Continue to stage ${stage + 1}` }).click();
	}

	await expect(page.getByRole('heading', { name: 'Your finger speed results' })).toBeVisible();
	await expect(page.getByRole('img', { name: /Speed and accuracy of each finger/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'What this assessment shows' })).toBeVisible();
	await page.getByText('View the results as a table').click();
	await expect(page.getByRole('rowheader', { name: 'Left little finger' })).toBeVisible();
});
