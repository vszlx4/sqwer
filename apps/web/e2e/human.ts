import { expect, type Page } from '@playwright/test';

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

/**
 * Answers a verification text question in any of its phrasings, as a person using a screen reader
 * would. (A determined script can do the same, which is why the other protections do not depend on
 * this question alone.)
 */
export function answerQuestion(q: string): string {
	let m = q.match(/the (\w+) letter of the word “(\w+)”|Which letter comes (\w+) in “(\w+)”|In the word “(\w+)”, type the letter in position (\w+)/);
	if (m) {
		const word = m[2] ?? m[4] ?? m[5]!;
		const index = m[1] ? ORDINALS.indexOf(m[1]) : m[3] ? ORDINALS.indexOf(m[3]) : NUMBERS.indexOf(m[6]!) - 1;
		return word[index]!;
	}
	m = q.match(/What is (\w+) plus (\w+)\?|Add (\w+) to (\w+)\.|have (\w+) keys and press (\w+) more/);
	if (m) return String(NUMBERS.indexOf((m[1] ?? m[3] ?? m[5])!) + NUMBERS.indexOf((m[2] ?? m[4] ?? m[6])!));
	const position = q.match(/(first|second|last)/);
	const list = q.match(/(?:list: |words |words: )([a-z]+, [a-z]+, [a-z]+)/);
	if (position && list) return list[1]!.split(', ')[['first', 'second', 'last'].indexOf(position[1]!)]!;
	throw new Error(`Unknown question: ${q}`);
}

/** Completes the verification using its text question, and waits for the background check to finish. */
export async function solveCaptcha(page: Page, answer?: string) {
	const toText = page.getByRole('button', { name: 'Use a text question' });
	if (await toText.isVisible()) await toText.click();
	const question = page.locator('.captcha .question');
	await expect(question).toHaveText(/\?|\.$/);
	const text = (await question.textContent())!.trim();
	await page.getByRole('textbox', { name: 'Your answer' }).fill(answer ?? answerQuestion(text));
	await expect.poll(async () => page.locator('input[name="altcha"]').inputValue(), { timeout: 30_000 }).not.toBe('');
}
