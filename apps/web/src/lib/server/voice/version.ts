/*
 * The voice settings as a short version for clip addresses: which voice, and everything that shapes its sound. A clip
 * behind a versioned address never changes, so browsers keep it; changing the voice or a setting changes the version.
 */

import { createHash } from 'node:crypto';
import { CLIP_VERSION } from '#lib/voice/clip.ts';
import { STANDARD_SPEEDS } from '../voice.ts';
import { fingerprint } from './clips.ts';
import type { VoiceId } from './settings.ts';

export function voiceVersion(voice: VoiceId): string {
	// A Supertonic fingerprint of a fixed word stands for its model, style, steps, speeds and format.
	const supertonic = voice === 'supertonic' ? [fingerprint('a', 'normal'), fingerprint('a', 'slow')] : null;
	const key = JSON.stringify([CLIP_VERSION, STANDARD_SPEEDS, voice, supertonic]);
	return createHash('sha256').update(key).digest('hex').slice(0, 10);
}
