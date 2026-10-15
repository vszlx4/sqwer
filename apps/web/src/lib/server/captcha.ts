import { createHmac, randomBytes, randomInt as cryptoRandomInt, timingSafeEqual } from 'node:crypto';
import { randomInt } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { CappedMap, create } from 'altcha-lib/frameworks/sveltekit';
import { secret } from './config.ts';

/*
 * sqwer's own verification, in two layers, run entirely on sqwer's server and the visitor's browser.
 * No third party is contacted and no cookie is set.
 *
 * 1. A proof-of-work check (ALTCHA library). The browser spends a moment of computation in the
 *    background, which makes automated submissions in bulk expensive.
 * 2. A challenge a person answers: characters drawn as distorted lines that must be typed, or,
 *    for anyone who cannot see the image, a short text question (WCAG 2.2 success criterion 1.1.1).
 *
 * Both are signed with server secrets, expire after ten minutes and can be used only once.
 */

const hmacSignatureSecret = secret('CAPTCHA_HMAC_SECRET');
const hmacKeySignatureSecret = secret('CAPTCHA_HMAC_KEY_SECRET');
const LIFETIME_MS = 10 * 60 * 1000;

/** Solved proofs and used challenges are remembered so neither can be replayed. */
const powStore = new CappedMap<string, boolean>({ maxSize: 20_000 });
const usedChallenges = new CappedMap<string, boolean>({ maxSize: 20_000 });

const pow = create({
	deriveKey,
	hmacSignatureSecret,
	hmacKeySignatureSecret,
	store: powStore,
	createChallengeParameters: () => ({
		algorithm: 'PBKDF2/SHA-256',
		cost: 1_000,
		counter: randomInt(1_000, 4_000),
		expiresAt: new Date(Date.now() + LIFETIME_MS)
	})
});

export type ChallengeKind = 'image' | 'text';

export interface PublicChallenge {
	kind: ChallengeKind;
	token: string;
	/** SVG markup of the characters, for `image` challenges. Generated here, never from user input. */
	svg?: string;
	/** The question, for `text` challenges. */
	question?: string;
}

/* ---------------------------------------------------------------- characters */

/**
 * Characters drawn as single-stroke paths in a 10 × 14 box. Shapes that are easily confused
 * (0/O, 1/I/L, 2/Z, 5/S, 6/G, 8/B, Q) are left out.
 */
const GLYPHS: Record<string, string> = {
	A: 'M0 14 L5 0 L10 14 M2.2 8.6 H7.8',
	C: 'M10 2.4 C8.6 0.6 6.8 0 5.2 0 C2 0 0 3 0 7 C0 11 2 14 5.2 14 C6.8 14 8.6 13.4 10 11.6',
	D: 'M0 0 V14 H4 C8 14 10 11 10 7 C10 3 8 0 4 0 Z',
	E: 'M10 0 H0 V14 H10 M0 7 H7',
	F: 'M10 0 H0 V14 M0 7 H7',
	H: 'M0 0 V14 M10 0 V14 M0 7 H10',
	J: 'M10 0 V10 C10 12.5 8 14 5.5 14 C3 14 1 12.5 0.5 10.5',
	K: 'M0 0 V14 M10 0 L0 8.5 M3.6 5.6 L10 14',
	M: 'M0 14 V0 L5 8 L10 0 V14',
	N: 'M0 14 V0 L10 14 V0',
	P: 'M0 14 V0 H6 C8.5 0 10 1.6 10 3.8 C10 6 8.5 7.6 6 7.6 H0',
	R: 'M0 14 V0 H6 C8.5 0 10 1.6 10 3.8 C10 6 8.5 7.6 6 7.6 H0 M5 7.6 L10 14',
	T: 'M0 0 H10 M5 0 V14',
	U: 'M0 0 V9.5 C0 12.3 2.2 14 5 14 C7.8 14 10 12.3 10 9.5 V0',
	V: 'M0 0 L5 14 L10 0',
	W: 'M0 0 L2.5 14 L5 5 L7.5 14 L10 0',
	X: 'M0 0 L10 14 M10 0 L0 14',
	Y: 'M0 0 L5 7 L10 0 M5 7 V14',
	'3': 'M0.5 1.5 C2 0.4 3.5 0 5 0 C7.8 0 9.5 1.6 9.5 3.6 C9.5 5.6 7.8 6.8 5 6.8 H3.5 M5 6.8 C8 6.8 10 8.3 10 10.4 C10 12.6 8 14 5 14 C3.2 14 1.6 13.5 0 12.3',
	'4': 'M7.5 14 V0 L0 10 H10',
	'7': 'M0 0 H10 L3.5 14',
	'9': 'M10 5 C10 7.8 8 9.6 5 9.6 C2 9.6 0 7.8 0 4.8 C0 2 2 0 5 0 C8 0 10 2 10 5 V9 C10 12 8 14 5 14 C3.4 14 2 13.4 1 12.4'
};
const ALPHABET = Object.keys(GLYPHS);
export const CHARACTER_COUNT = 5;

const rand = (min: number, max: number) => min + (cryptoRandomInt(0, 1_000_000) / 1_000_000) * (max - min);
const pick = <T>(list: readonly T[]): T => list[cryptoRandomInt(0, list.length)]!;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Draws the characters with random position, size, rotation and slant, crossed by noise lines. */
export function drawCharacters(text: string): string {
	const W = 280;
	const H = 84;
	const parts: string[] = [];

	// Background speckle and short strokes, drawn faintly so they do not hide the characters.
	for (let i = 0; i < 26; i++) {
		const x = r1(rand(0, W));
		const y = r1(rand(0, H));
		parts.push(`<path d="M${x} ${y} l${r1(rand(-9, 9))} ${r1(rand(-9, 9))}" stroke-width="${r1(rand(1, 2))}" opacity="${r1(rand(0.15, 0.35))}"/>`);
	}

	const step = (W - 40) / text.length;
	[...text].forEach((ch, i) => {
		const scale = rand(3.1, 3.7);
		const x = r1(22 + i * step + rand(-4, 4));
		const y = r1((H - 14 * scale) / 2 + rand(-6, 6));
		const rotate = r1(rand(-20, 20));
		const skew = r1(rand(-14, 14));
		const width = r1(rand(2.6, 3.4));
		parts.push(
			`<path d="${GLYPHS[ch]}" transform="translate(${x} ${y}) rotate(${rotate} ${r1(5 * scale)} ${r1(7 * scale)}) skewX(${skew}) scale(${r1(scale)})" stroke-width="${width}" vector-effect="non-scaling-stroke"/>`
		);
	});

	// Two curves cross every character so the shapes cannot be separated by simple segmentation.
	for (let i = 0; i < 2; i++) {
		const y0 = r1(rand(18, H - 18));
		parts.push(
			`<path d="M-4 ${y0} C${r1(rand(50, 110))} ${r1(rand(0, H))} ${r1(rand(160, 230))} ${r1(rand(0, H))} ${W + 4} ${r1(rand(18, H - 18))}" stroke-width="${r1(rand(1.6, 2.4))}"/>`
		);
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">${parts.join('')}</svg>`;
}

/* ----------------------------------------------------------- text questions */

const WORDS = ['keyboard', 'letter', 'finger', 'practice', 'lesson', 'rhythm', 'accuracy', 'record', 'window', 'garden', 'planet', 'river', 'orange', 'winter', 'silver', 'market'];
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

/** Short questions that can be answered with a screen reader or without sight. */
function textQuestion(): { question: string; answers: string[] } {
	switch (cryptoRandomInt(0, 3)) {
		case 0: {
			const word = pick(WORDS);
			const n = cryptoRandomInt(0, ORDINALS.length);
			return { question: `What is the ${ORDINALS[n]} letter of the word “${word}”?`, answers: [word[n]!] };
		}
		case 1: {
			const a = cryptoRandomInt(2, 11);
			const b = cryptoRandomInt(2, 10);
			return { question: `What is ${NUMBERS[a]} plus ${NUMBERS[b]}? You may answer in digits.`, answers: [String(a + b), NUMBERS[a + b]!] };
		}
		default: {
			const list = [...new Set(Array.from({ length: 6 }, () => pick(WORDS)))].slice(0, 3);
			while (list.length < 3) list.push(pick(WORDS.filter((w) => !list.includes(w))));
			return { question: `Type the last word in this list: ${list.join(', ')}.`, answers: [list[2]!] };
		}
	}
}

/* ------------------------------------------------------------------ tokens */

const normalise = (s: string) => s.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '');
const mac = (data: string) => createHmac('sha256', hmacSignatureSecret).update(data).digest('base64url');

function sign(kind: ChallengeKind, answers: string[]): string {
	const id = randomBytes(12).toString('base64url');
	const body = Buffer.from(
		JSON.stringify({ id, kind, exp: Date.now() + LIFETIME_MS, answers: answers.map((a) => mac(`${id}:${normalise(a)}`)) })
	).toString('base64url');
	return `${body}.${mac(body)}`;
}

function equal(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

export function createChallenge(kind: ChallengeKind): PublicChallenge {
	if (kind === 'text') {
		const { question, answers } = textQuestion();
		return { kind, token: sign(kind, answers), question };
	}
	const text = Array.from({ length: CHARACTER_COUNT }, () => pick(ALPHABET)).join('');
	return { kind, token: sign(kind, [text]), svg: drawCharacters(text) };
}

/** Issues a proof-of-work challenge in the format the browser solves. */
export async function createProofOfWork(): Promise<unknown> {
	return (await pow.challengeHandler()).json();
}

/** Checks a person's answer. Each token is accepted once, whether the answer is right or wrong. */
export function checkAnswer(token: unknown, answer: unknown): boolean {
	if (typeof token !== 'string' || typeof answer !== 'string' || !answer.trim() || token.length > 2_000) return false;
	const [body, signature] = token.split('.');
	if (!body || !signature || !equal(signature, mac(body))) return false;
	let data: { id?: string; exp?: number; answers?: string[] };
	try {
		data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
	} catch {
		return false;
	}
	if (!data.id || !data.exp || !Array.isArray(data.answers) || data.exp < Date.now()) return false;
	if (usedChallenges.has(data.id)) return false;
	usedChallenges.set(data.id, true);
	const given = mac(`${data.id}:${normalise(answer)}`);
	return data.answers.some((a) => typeof a === 'string' && equal(a, given));
}

export type CaptchaOutcome = 'ok' | 'incomplete' | 'incorrect';

/** Verifies both layers from a submitted form. */
export async function verifyCaptcha(form: FormData): Promise<CaptchaOutcome> {
	const payload = form.get('altcha');
	const token = form.get('captchaToken');
	const answer = form.get('captchaAnswer');
	if (typeof payload !== 'string' || !payload || typeof answer !== 'string' || !answer.trim()) return 'incomplete';
	const proof = await pow.verify(payload, deriveKey, hmacSignatureSecret, hmacKeySignatureSecret, powStore);
	if (proof.error || !proof.verification?.verified) return 'incomplete';
	return checkAnswer(token, answer) ? 'ok' : 'incorrect';
}

export const CAPTCHA_MESSAGES: Record<Exclude<CaptchaOutcome, 'ok'>, string> = {
	incomplete: 'Please complete the verification.',
	incorrect: 'The answer did not match. A new challenge has been shown; please try again.'
};
