import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import qrcode from 'qrcode-generator';
import { secret } from './config.ts';

/*
 * TOTP (RFC 6238, RFC 4226 truncation): 6 digits, 30 s, HMAC-SHA-1. 160-bit secrets, AES-256-GCM under
 * TOTP_ENCRYPTION_SECRET. Accepted steps are recorded; no code works twice.
 */

export const STEP_SECONDS = 30;
const DIGITS = 6;
/** Steps accepted either side of the current one, for clocks that differ slightly. */
const DRIFT = 1;
const ISSUER = 'sqwer';

/* ---------------------------------------------------------------- base32 (RFC 4648) */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
	let bits = 0;
	let value = 0;
	let out = '';
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
	return out;
}

export function base32Decode(text: string): Buffer {
	const clean = text.toUpperCase().replace(/[\s=-]/g, '');
	let bits = 0;
	let value = 0;
	const out: number[] = [];
	for (const ch of clean) {
		const index = ALPHABET.indexOf(ch);
		if (index < 0) throw new Error('Invalid base32 character.');
		value = (value << 5) | index;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

/* ---------------------------------------------------------------- codes */

export function newTotpSecret(): string {
	return base32Encode(randomBytes(20));
}

export const stepAt = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/** The code for one time step (HOTP over the step number). */
export function codeAt(secretBase32: string, step: number, digits = DIGITS): string {
	const counter = Buffer.alloc(8);
	counter.writeBigUInt64BE(BigInt(step));
	const mac = createHmac('sha1', base32Decode(secretBase32)).update(counter).digest();
	const offset = mac[mac.length - 1]! & 15;
	const binary = ((mac[offset]! & 127) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
	return String(binary % 10 ** digits).padStart(digits, '0');
}

/** Time step of a valid code (±1 step) newer than the last accepted one; else null. */
export function verifyCode(secretBase32: string, code: string, lastStep: number | null, now = Date.now()): number | null {
	const given = code.replace(/\s/g, '');
	if (!/^\d{6}$/.test(given)) return null;
	const current = stepAt(now);
	let matched: number | null = null;
	for (let step = current - DRIFT; step <= current + DRIFT; step++) {
		// Compare every candidate, so the time taken does not depend on which one matches.
		const ok = timingSafeEqual(Buffer.from(codeAt(secretBase32, step)), Buffer.from(given));
		if (ok && matched === null) matched = step;
	}
	if (matched === null || (lastStep !== null && matched <= lastStep)) return null;
	return matched;
}

/** The address an authenticator app reads from the QR code. */
export function otpauthUri(secretBase32: string, account: string): string {
	const label = `${ISSUER}:${account}`;
	const params = new URLSearchParams({ secret: secretBase32, issuer: ISSUER, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
	return `otpauth://totp/${encodeURIComponent(label)}?${params}`;
}

/** The QR code as an SVG data URL, for an <img> (allowed by the site's Content Security Policy). */
export function qrDataUrl(text: string): string {
	const qr = qrcode(0, 'M');
	qr.addData(text);
	qr.make();
	const svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** The secret in groups of four, for typing into an app by hand. */
export const groupSecret = (s: string) => s.replace(/(.{4})/g, '$1 ').trim();

/* ---------------------------------------------------------------- storage */

const key = () => createHash('sha256').update(`totp\u0000${secret('TOTP_ENCRYPTION_SECRET')}`).digest();

export function encryptSecret(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key(), iv);
	const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptSecret(stored: string): string {
	const [version, iv, tag, data] = stored.split('.');
	if (version !== 'v1' || !iv || !tag || !data) throw new Error('Unreadable authenticator secret.');
	const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
	decipher.setAuthTag(Buffer.from(tag, 'base64url'));
	return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
