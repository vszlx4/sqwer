import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { isSpeakable } from '#lib/courses/voice/clip.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { DATA_DIR } from '#lib/server/config.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { addressOf } from '#lib/server/security-log.ts';
import { clip, hasClip as hasStandardClip } from '#lib/server/voice.ts';
import { clipPath, fingerprint, isSpeed } from '#lib/server/voice/clips.ts';
import { activeVoice, readSettings, voiceDir } from '#lib/server/voice/settings.ts';
import type { RequestHandler } from './$types';

const TEN_MINUTES = 10 * 60 * 1000;
const VOICE_DIR = voiceDir(DATA_DIR);

/**
 * A spoken word in a voice: `auto` (the voice this copy uses), `standard` or `supertonic`; speed `normal` or `slow`.
 * Supertonic clips are made ahead of time; a word not made yet answers with the Standard clip (header X-Voice), so
 * Listen and type never waits. The answer can change when the voice does, so it is revalidated, not cached for good.
 */
export const GET: RequestHandler = async (event) => {
	const { voice, speed, word } = event.params;
	if (!['auto', 'standard', 'supertonic'].includes(voice) || !isSpeed(speed) || !isSpeakable(word)) error(404, 'Not found.');
	const wanted = voice === 'auto' ? activeVoice(readSettings(DATA_DIR)) : voice;

	if (wanted === 'supertonic') {
		const fp = fingerprint(word, speed);
		const mp3 = await readFile(clipPath(VOICE_DIR, fp)).catch(() => null);
		if (mp3) {
			const etag = `"${fp}"`;
			const headers = { ETag: etag, 'Cache-Control': 'no-cache', 'X-Voice': 'supertonic', 'Content-Security-Policy': "default-src 'none'; sandbox" };
			if (event.request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
			return new Response(new Uint8Array(mp3), { headers: { ...headers, 'Content-Type': 'audio/mpeg' } });
		}
	}

	// Standard (Kokoro): one speed, rendered per word on first request; rendering is rate-limited.
	if (!hasStandardClip(word)) {
		const ip = addressOf(event) ?? 'unknown';
		if (!rateLimit(`voice:${ip}`, 300, TEN_MINUTES).ok || !rateLimit(`voice:net:${networkOf(ip)}`, 1_500, TEN_MINUTES).ok) {
			error(429, 'Too many words at once. Try again in a few minutes.');
		}
	}
	const wav = await clip(word).catch((e: unknown) => {
		console.error(JSON.stringify({ kind: 'voice', word, error: e instanceof Error ? e.message : String(e) }));
		error(503, 'The voice is not available right now.');
	});
	return new Response(new Uint8Array(wav), {
		headers: {
			'Content-Type': 'audio/wav',
			'Cache-Control': 'no-cache',
			'X-Voice': 'standard',
			'Content-Security-Policy': "default-src 'none'; sandbox"
		}
	});
};
