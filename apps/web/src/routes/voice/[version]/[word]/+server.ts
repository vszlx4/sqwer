import { error } from '@sveltejs/kit';
import { CLIP_VERSION, isSpeakable } from '#lib/courses/voice/clip.ts';
import { networkOf } from '#lib/server/bot/risk.ts';
import { rateLimit } from '#lib/server/rate-limit.ts';
import { addressOf } from '#lib/server/security-log.ts';
import { clip, hasClip } from '#lib/server/voice.ts';
import type { RequestHandler } from './$types';

const TEN_MINUTES = 10 * 60 * 1000;

/** A spoken word for Listen and type. Rendering is rate-limited; clips already on disk are not. */
export const GET: RequestHandler = async (event) => {
	const { version, word } = event.params;
	if (version !== String(CLIP_VERSION) || !isSpeakable(word)) error(404, 'Not found.');
	if (!hasClip(word)) {
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
			// The version is in the path: a clip behind a URL never changes.
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Content-Security-Policy': "default-src 'none'; sandbox"
		}
	});
};
