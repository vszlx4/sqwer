import { createHmac } from 'node:crypto';

/** Authenticator codes for the tests (RFC 6238, as lib/server/totp.ts), from a base32 secret. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decode(secret: string): Buffer {
	let bits = 0;
	let value = 0;
	const out: number[] = [];
	for (const ch of secret.replace(/\s/g, '').toUpperCase()) {
		value = (value << 5) | ALPHABET.indexOf(ch);
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

const stepNow = () => Math.floor(Date.now() / 30_000);

function codeAt(secret: string, step: number): string {
	const counter = Buffer.alloc(8);
	counter.writeBigUInt64BE(BigInt(step));
	const mac = createHmac('sha1', decode(secret)).update(counter).digest();
	const o = mac[mac.length - 1]! & 15;
	return String((((mac[o]! & 127) << 24) | (mac[o + 1]! << 16) | (mac[o + 2]! << 8) | mac[o + 3]!) % 1_000_000).padStart(6, '0');
}

/** Codes are accepted once: the last step used per secret, so the next code is always a new one. */
const used = new Map<string, number>();

/** A code the server has not seen yet, waiting for the next 30-second step if necessary. */
export async function freshCode(secret: string): Promise<string> {
	let step = stepNow();
	while (step <= (used.get(secret) ?? -1)) {
		await new Promise((r) => setTimeout(r, 1000));
		step = stepNow();
	}
	used.set(secret, step);
	return codeAt(secret, step);
}
