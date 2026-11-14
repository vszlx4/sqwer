import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { isSpeakable } from '#lib/voice/clip.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { DATA_DIR } from '#lib/server/config.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { addressOf } from '#lib/server/security-log.ts';
import { clip, hasClip as hasStandardClip } from '#lib/server/voice.ts';
import { clipPath, fingerprint, isSpeed } from '#lib/server/voice/clips.ts';
import { activeVoice, readSettings, voiceDir } from '#lib/server/voice/settings.ts';
import { voiceVersion } from '#lib/server/voice/version.ts';
import type { RequestHandler } from './$types';

const TEN_MINUTES = 10 * 60 * 1000;
const VOICE_DIR = voiceDir(DATA_DIR);
const SAFE = { 'Content-Security-Policy': "default-src 'none'; sandbox" };
/** The version is in the path: a clip behind it never changes. */
const KEEP = 'public, max-age=31536000, immutable';

/**
 * A spoken word: /voice/<settings version>/<voice>/<speed>/<word>, voice `auto` (the one this copy uses), `standard` or
 * `supertonic`. An old version answers 410, so the page asks for the current one. With Supertonic chosen, a word
 * whose clip is not made yet answers with the Standard clip, kept only briefly so the made clip replaces it.
 */
export const GET: RequestHandler = async (event) => {
	const { version, voice, speed, word } = event.params;
	if (!['auto', 'standard', 'supertonic'].includes(voice) || !isSpeed(speed) || !isSpeakable(word)) error(404, 'Not found.');
	const active = activeVoice(readSettings(DATA_DIR));
	if (version !== voiceVersion(active)) error(410, 'The voice changed.');
	const wanted = voice === 'auto' ? active : voice;

	if (wanted === 'supertonic') {
		const mp3 = await readFile(clipPath(VOICE_DIR, fingerprint(word, speed))).catch(() => null);
		if (mp3) return new Response(new Uint8Array(mp3), { headers: { ...SAFE, 'Content-Type': 'audio/mpeg', 'Cache-Control': KEEP, 'X-Voice': 'supertonic' } });
	}

	// Standard (Kokoro): rendered per word and speed on first request; rendering is rate-limited.
	if (!hasStandardClip(word, speed)) {
		const ip = addressOf(event) ?? 'unknown';
		if (!rateLimit(`voice:${ip}`, 300, TEN_MINUTES).ok || !rateLimit(`voice:net:${networkOf(ip)}`, 1_500, TEN_MINUTES).ok) {
			error(429, 'Too many words at once. Try again in a few minutes.');
		}
	}
	const wav = await clip(word, speed).catch((e: unknown) => {
		console.error(JSON.stringify({ kind: 'voice', word, speed, error: e instanceof Error ? e.message : String(e) }));
		error(503, 'The voice is not available right now.');
	});
	const cache = wanted === 'supertonic' ? 'public, max-age=300' : KEEP;
	return new Response(new Uint8Array(wav), { headers: { ...SAFE, 'Content-Type': 'audio/wav', 'Cache-Control': cache, 'X-Voice': 'standard' } });
};
