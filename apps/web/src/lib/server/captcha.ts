import { randomInt } from 'altcha-lib';
import { deriveKey } from 'altcha-lib/algorithms/pbkdf2';
import { CappedMap, create } from 'altcha-lib/frameworks/sveltekit';
import { secret } from './config.ts';

// ALTCHA: a self-hosted proof-of-work check. The browser spends a moment of
// computation to prove it is a real visitor; no third party is contacted and
// no tracking cookie is set.
const hmacSignatureSecret = secret('CAPTCHA_HMAC_SECRET');
const hmacKeySignatureSecret = secret('CAPTCHA_HMAC_KEY_SECRET');
/** Solved challenges are remembered so a payload cannot be replayed. */
const store = new CappedMap<string, boolean>({ maxSize: 20_000 });

export const altcha = create({
	deriveKey,
	hmacSignatureSecret,
	hmacKeySignatureSecret,
	store,
	createChallengeParameters: () => ({
		algorithm: 'PBKDF2/SHA-256',
		cost: 1_000,
		counter: randomInt(1_000, 4_000),
		expiresAt: new Date(Date.now() + 10 * 60 * 1000)
	})
});

export async function verifyCaptcha(payload: FormDataEntryValue | null): Promise<boolean> {
	if (typeof payload !== 'string' || !payload) return false;
	const result = await altcha.verify(payload, deriveKey, hmacSignatureSecret, hmacKeySignatureSecret, store);
	return !result.error && !!result.verification?.verified;
}
