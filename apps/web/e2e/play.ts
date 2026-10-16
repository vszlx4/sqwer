import { expect, type Page } from '@playwright/test';

/** Types every word of the current drill. */
export async function typeDrill(page: Page) {
	await page.waitForSelector('[data-word]');
	const words = await page.$$eval('[data-word]', (els) => els.map((e) => e.textContent ?? ''));
	await page.keyboard.type(words.join(' '), { delay: 20 });
}

/** Continues from a passed step. */
export async function proceed(page: Page) {
	const button = page.locator('.outcome').getByRole('button').first();
	await expect(button).toBeVisible({ timeout: 60_000 });
	await expect(page.locator('.outcome')).toHaveClass(/passed/);
	await page.keyboard.press('Enter');
}

/** Waits for a game's start screen and starts it. */
async function start(page: Page) {
	await expect(page.getByRole('button', { name: /^Start/ })).toBeVisible();
	await page.keyboard.press('Space');
}

/** A lesson step's outcome, or the summary of an endless round. */
const outcome = (page: Page) => page.locator('.outcome, .endless .result').isVisible();

/** Key hunt: presses each key as it lights up. */
export async function playKeyHunt(page: Page) {
	await start(page);
	const cap = page.locator('.cap .char');
	await expect(cap).toBeVisible();
	while (!(await outcome(page))) {
		if (await cap.isVisible()) {
			const key = ((await cap.textContent()) ?? '').trim().toLowerCase();
			if (key) await page.keyboard.press(key);
		}
		await page.waitForTimeout(60);
	}
}

/** Echo: watches each sequence, then types it back. */
export async function playEcho(page: Page) {
	await start(page);
	while (!(await outcome(page))) {
		const sequence = await page.evaluate(
			() =>
				new Promise<string[] | null>((resolve) => {
					const seen: string[] = [];
					const timer = setInterval(() => {
						if (document.querySelector('.outcome')) return (clearInterval(timer), resolve(null));
						const lit = document.querySelector('.slots li.lit');
						if (lit) seen[[...lit.parentElement!.children].indexOf(lit)] = lit.textContent!.trim().toLowerCase();
						if (document.querySelector('.message.turn')) {
							clearInterval(timer);
							resolve(seen);
						}
					}, 15);
				})
		);
		if (!sequence) break;
		for (const k of sequence) await page.keyboard.press(k === ';' ? 'Semicolon' : k);
		await page.waitForFunction(() => !document.querySelector('.message.turn') || document.querySelector('.outcome'));
	}
}

/** Rhythm: presses each lane's key as a note reaches the line. */
export async function playRhythm(page: Page) {
	await expect(page.getByRole('button', { name: /^Start/ })).toBeVisible();
	await page.evaluate(() => {
		const lanes = [...document.querySelectorAll('.lane')];
		const keys = lanes.map((l) => l.querySelector('.key')!.textContent!.trim().toLowerCase());
		const line = document.querySelector('.line')!.getBoundingClientRect().top;
		const pressed = new Set<Element>();
		const frame = () => {
			lanes.forEach((lane, i) => {
				for (const note of lane.querySelectorAll('.note:not(.missed)')) {
					const r = note.getBoundingClientRect();
					if (Math.abs(r.top + r.height / 2 - line) < 6 && !pressed.has(note)) {
						pressed.add(note);
						document.body.dispatchEvent(new KeyboardEvent('keydown', { key: keys[i], bubbles: true }));
					}
				}
			});
			if (document.querySelector('.lane')) requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	});
	await page.keyboard.press('Space');
	await expect(page.locator('.outcome')).toBeVisible({ timeout: 60_000 });
}

/** Falling words or letters: types whatever is lowest on the screen. */
export async function playFalling(page: Page) {
	await start(page);
	while (!(await outcome(page))) {
		const drops = await page.$$eval('.drop', (els) =>
			els.map((e) => ({ text: e.textContent!.trim(), y: new DOMMatrix(getComputedStyle(e).transform).m42 })).sort((a, b) => b.y - a.y)
		);
		if (drops[0]) await page.keyboard.type(drops[0].text, { delay: 10 });
		await page.waitForTimeout(50);
	}
}

/** Race: types the passage before the pacer. */
export async function playRace(page: Page) {
	await start(page);
	// The passage can be read first; Space skips the rest of the preview.
	await expect(page.getByRole('button', { name: /^Start now/ })).toBeVisible();
	await page.keyboard.press('Space');
	await expect(page.locator('.passage')).toBeVisible();
	await page.waitForTimeout(1700);
	const text = await page.evaluate(() =>
		[...document.querySelectorAll('.passage > span')].filter((s) => !s.classList.contains('caret')).map((s) => s.textContent).join('')
	);
	await page.keyboard.type(text, { delay: 15 });
	await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
}
