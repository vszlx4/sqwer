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
	await expect(page.getByRole('heading', { name: 'Level', exact: true })).toBeVisible();
	await page.locator('.level', { hasText: 'Easy' }).click();
	await expect(page.getByRole('radio', { name: 'Easy', exact: true })).toBeChecked();
	await page.getByRole('button', { name: 'Start at Easy' }).click();
	await expect(page.locator('.endless > .hud')).toContainText('Easy');

	await playFalling(page);
	await expect(page.getByRole('heading', { name: 'Round 1 cleared' })).toBeVisible();
	await expect(page.locator('.next')).toContainText('Next round: Easy.');

	// Ending the run shows the totals and keeps the best score.
	await page.getByRole('button', { name: 'End the run' }).click();
	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
	await expect(page.locator('.run-result .points')).toHaveText('2');
	await page.goto('/exams');
	await expect(page.locator('#games').getByRole('link', { name: /Falling words/ })).toContainText('Best 2');
});

test('a run starts at the top and fills the first screen; the footer waits below', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/play/falling-letters', { waitUntil: 'networkidle' });
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await page.getByRole('button', { name: /^Start/ }).click();
	await expect(page.locator('.endless > .hud')).toBeVisible();
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	await expect(page.getByRole('heading', { level: 1 })).toHaveClass(/sr-only/);
	const footerTop = await page.locator('footer').evaluate((f) => f.getBoundingClientRect().top);
	expect(footerTop).toBeGreaterThanOrEqual(900);
});

test('every game opens on the same menu: level, settings where it has any, how it works', async ({ page }) => {
	test.setTimeout(120_000);
	for (const width of [1440, 375]) {
		await page.setViewportSize({ width, height: 900 });
		for (const game of ['race', 'falling-words', 'falling-letters', 'echo', 'listen', 'keyhunt']) {
			await page.goto(`/play/${game}`, { waitUntil: 'networkidle' });
			await expect(page.getByRole('heading', { name: 'Level', exact: true })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Settings' })).toHaveCount(['falling-letters', 'keyhunt'].includes(game) ? 0 : 1);
			await expect(page.getByRole('radio')).toHaveCount(7);
			await expect(page.getByRole('button', { name: /^Start at/ })).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${game} at ${width}`).toBe(true);
			if (width === 1440 && (game === 'listen' || game === 'keyhunt')) {
				expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
			}
		}
	}
});

test('adaptive says so when a round moves the run into another level', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('/play/falling-letters', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: 'Start at Adaptive' }).click();
	await expect(page.locator('.runbar .level')).toContainText('Easy');
	await playFalling(page);
	await expect(page.getByRole('heading', { name: 'Round 1 cleared' })).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(page.locator('.runbar .level')).toContainText('Medium');
	await expect(page.locator('.runbar .note')).toHaveText('Level up: Medium');
	await expect(page.locator('.runbar .note')).toHaveCount(0, { timeout: 5000 });
});

test('an unknown game is not found', async ({ page }) => {
	const res = await page.goto('/play/chess');
	expect(res?.status()).toBe(404);
});

test('Listen and type: endless words, the explanation in place, Stop with statistics', async ({ page }) => {
	await page.goto('/play/listen');
	await page.getByRole('button', { name: /^Start at/ }).click();

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
	await expect(page.locator('.hud')).toContainText(/1\s*Words/);

	await page.getByRole('button', { name: 'Stop' }).click();
	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'To practice' })).toBeVisible();
	await expect(page.locator('.misses li').first()).toHaveAttribute('title', 'You typed zqzq');
	// The results fit the first screen and pass axe.
	const bottom = await page.locator('.run-result').evaluate((e) => e.getBoundingClientRect().bottom);
	expect(bottom).toBeLessThanOrEqual(page.viewportSize()!.height);
	expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
});

/** A short 440 Hz tone as a 16-bit mono WAV, standing in for a word's clip. */
function tinyWav(seconds = 0.25, rate = 24000): Buffer {
	const n = Math.round(seconds * rate);
	const b = Buffer.alloc(44 + n * 2);
	b.write('RIFF', 0);
	b.writeUInt32LE(36 + n * 2, 4);
	b.write('WAVEfmt ', 8);
	b.writeUInt32LE(16, 16);
	b.writeUInt16LE(1, 20);
	b.writeUInt16LE(1, 22);
	b.writeUInt32LE(rate, 24);
	b.writeUInt32LE(rate * 2, 28);
	b.writeUInt16LE(2, 32);
	b.writeUInt16LE(16, 34);
	b.write('data', 36);
	b.writeUInt32LE(n * 2, 40);
	for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), 44 + i * 2);
	return b;
}

test('Listen and type plays each word from its clip, and Slow from its own', async ({ page }) => {
	const asked: string[] = [];
	const wav = tinyWav();
	await page.route('**/voice/*/auto/*/*', (route) => {
		asked.push(new URL(route.request().url()).pathname);
		return route.fulfill({ contentType: 'audio/wav', body: wav });
	});
	await page.addInitScript(() => {
		const w = window as unknown as { played: number };
		w.played = 0;
		const start = AudioBufferSourceNode.prototype.start;
		AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
			w.played++;
			return start.apply(this, args);
		};
	});
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: /^Start at/ }).click();

	await expect.poll(() => page.evaluate(() => (window as unknown as { played: number }).played)).toBeGreaterThan(0);
	expect(asked.some((p) => /^\/voice\/[0-9a-f]{10}\/auto\/normal\/[a-z'-]+$/.test(p))).toBe(true);
	await expect(page.locator('.player .sound')).not.toContainText(/\w/);

	const slow = page.getByRole('button', { name: 'Slow' });
	await expect(slow).toBeEnabled();
	await slow.click();
	await expect.poll(() => asked.some((p) => p.includes('/auto/slow/'))).toBe(true);
	await expect.poll(() => page.evaluate(() => (window as unknown as { played: number }).played)).toBeGreaterThan(1);
});

test('Listen and type plays a test word from the sound settings', async ({ page }) => {
	const asked: string[] = [];
	const wav = tinyWav();
	await page.route('**/voice/*/auto/*/*', (route) => {
		asked.push(new URL(route.request().url()).pathname);
		return route.fulfill({ contentType: 'audio/wav', body: wav });
	});
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await expect(page.getByRole('slider', { name: 'Voice volume' })).toBeVisible();
	await page.getByRole('button', { name: 'Play a test word' }).click();
	await expect(page.getByText(/^Heard it\?/)).toBeVisible();
	expect(asked.some((p) => p.endsWith('/auto/normal/hello'))).toBe(true);
});

test('Listen and type says so when the voice keeps failing, and shows the words', async ({ page }) => {
	await page.route('**/voice/*/auto/*/*', (route) => route.fulfill({ status: 503, body: 'down' }));
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: /^Start at/ }).click();
	await expect(page.locator('.player .shown')).toHaveText(/^[a-z'-]+$/);
	await page.getByRole('button', { name: 'Play the word again' }).click();
	await expect(page.locator('.state')).toContainText('The voice is not answering. Words are shown instead.');
});

test('Listen and type shows the words instead when sound is turned off in settings', async ({ page }) => {
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('checkbox', { name: /Show words instead of sound/ }).check();
	await page.getByRole('button', { name: /^Start at/ }).click();
	await expect(page.locator('.player .shown')).toHaveText(/^[a-z'-]+$/);
	await expect(page.getByRole('button', { name: 'Slow' })).toHaveCount(0);
	await page.reload({ waitUntil: 'networkidle' });
	await expect(page.getByRole('checkbox', { name: /Show words instead of sound/ })).toBeChecked();
});

test('Listen and type: a missed word is practiced unscored after Stop, then the review leads back to the run', async ({ page }) => {
	await page.route('**/voice/*/auto/*/*', (route) => route.fulfill({ contentType: 'audio/wav', body: tinyWav() }));
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: /^Start at/ }).click();
	const input = page.getByTestId('listen-input');
	await expect(input).toBeEnabled();
	// The first word is up once it has played.
	await expect(page.locator('.state')).toContainText('Heard');
	await page.keyboard.type('zqzq');
	await page.keyboard.press('Enter');
	await expect(page.locator('#listen-grade')).toContainText('Not quite');
	await page.getByRole('button', { name: 'Stop' }).click();

	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
	await page.getByRole('button', { name: 'Practice these words' }).click();
	await page.getByRole('button', { name: /^Start/ }).click();
	await expect(input).toBeEnabled();
	await page.keyboard.type('zqzq');
	await page.keyboard.press('Enter');
	await page.getByRole('button', { name: 'See the round' }).click();

	await expect(page.getByText('Practice round')).toBeVisible();
	await expect(page.getByText('Not scored')).toBeVisible();
	await expect(page.locator('.answers li')).toHaveCount(1);
	await expect(page.locator('.answers li')).toContainText('you typed zqzq');
	await expect(page.getByRole('button', { name: 'Finish' })).toBeFocused();
	const axe = await new AxeBuilder({ page }).include('main').analyze();
	expect(axe.violations).toEqual([]);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Run complete' })).toBeVisible();
});

test('Listen and type limits replays at high levels', async ({ page }) => {
	await page.route('**/voice/*/auto/*/*', (route) => route.fulfill({ contentType: 'audio/wav', body: tinyWav(0.15) }));
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByText('Insane', { exact: true }).click();
	await page.getByRole('button', { name: 'Start at Insane' }).click();
	await expect(page.locator('.state')).toContainText('1 replay left');
	const again = page.getByRole('button', { name: 'Play the word again' });
	await expect(again).toBeEnabled();
	await again.click();
	await expect(page.locator('.state')).toContainText('no replays left');
	await expect(again).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Slow' })).toBeDisabled();
});

test('Listen and type does not count a play that was not heard', async ({ page }) => {
	let down = true;
	let failed = 0;
	await page.route('**/voice/*/auto/*/*', (route) => {
		if (down) {
			failed++;
			return route.fulfill({ status: 503, body: 'down' });
		}
		return route.fulfill({ contentType: 'audio/wav', body: tinyWav(0.15) });
	});
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByText('Insane', { exact: true }).click();
	await page.getByRole('button', { name: 'Start at Insane' }).click();
	await expect.poll(() => failed).toBeGreaterThan(0);
	const again = page.getByRole('button', { name: 'Play the word again' });
	await expect(again).toBeEnabled();
	down = false;
	await again.click();
	// The failed first play was free: the one that was heard is the first, and the replay is still there.
	await expect(page.locator('.state')).toContainText(/Heard once\s*· 1 replay left/);
});

test('Listen and type fast mode moves on the moment a word is typed right, and Enter plays it again', async ({ page }) => {
	const asked: string[] = [];
	await page.route('**/voice/*/auto/*/*', (route) => {
		asked.push(new URL(route.request().url()).pathname);
		return route.fulfill({ contentType: 'audio/wav', body: tinyWav(0.1) });
	});
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('checkbox', { name: /Fast mode/ }).check();
	await page.getByRole('checkbox', { name: /Show words instead of sound/ }).check();
	await page.getByRole('button', { name: /^Start at/ }).click();

	const input = page.getByTestId('listen-input');
	await expect(input).toBeFocused();
	const word = (await page.locator('.player .shown').textContent())!.trim();
	await page.keyboard.type(word);
	// The whole word stays on screen, marked right, before the next one takes its place.
	await expect(input).toHaveValue(word);
	await expect(input).toHaveClass(/held/);
	// No Enter: the next word is up and the answer box is empty again.
	await expect(page.locator('.hud')).toContainText(/1\s*Words/);
	await expect(input).toHaveValue('');
	await expect(page.locator('#listen-grade')).toHaveCount(0);

	// Enter plays the word again (shown again here) and never checks the answer.
	await expect(page.locator('.player .shown')).toHaveCount(0);
	await page.keyboard.type('zq');
	await page.keyboard.press('Enter');
	await expect(page.locator('.player .shown')).toBeVisible();
	await expect(page.locator('#listen-grade')).toHaveCount(0);
	await expect(input).toHaveValue('zq');

	// Esc skips a word it cannot get, and shows what it was.
	await page.keyboard.press('Escape');
	await expect(page.locator('#listen-grade')).toContainText('Not quite');
	await expect(page.locator('.hud')).toContainText(/2\s*Words/);
});

test('the Listen and type answer box takes letters only', async ({ page }) => {
	await page.route('**/voice/*/auto/*/*', (route) => route.fulfill({ contentType: 'audio/wav', body: tinyWav(0.1) }));
	await page.goto('/play/listen', { waitUntil: 'networkidle' });
	await page.getByRole('button', { name: /^Start at/ }).click();
	const input = page.getByTestId('listen-input');
	await expect(input).toBeEnabled();
	await expect(page.locator('.state')).toContainText('Heard');
	await page.keyboard.type("A1b-c d'!?.e");
	await expect(input).toHaveValue('abcde');
	await input.fill('x2y_z');
	await expect(input).toHaveValue('xyz');
});
