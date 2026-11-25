/* One Supertonic clip: respelled text, seeded noise, silence trimmed, slow stretched from the normal take, halved rate, MP3. */

import { stretch, trimSilence } from '../voice-audio.ts';
import { SPEEDS, fingerprint, seedOf, spoken } from './clips.ts';
import type { ClipMaker } from './generator.ts';
import { encodeMp3, halveRate } from './mp3.ts';
import type { GeneratorMode } from './settings.ts';
import { loadSupertonic } from './supertonic.ts';

/**
 * Threads for a mode. Measured on an M2: one clip takes 565 ms on one thread, 341 ms on two, and no less on more, so
 * active mode uses two. Low mode on macOS runs on the efficiency cores, where two threads take 1.9 s a clip at a
 * fraction of the power; elsewhere it is one thread with rests.
 */
export const threadsFor = (mode: GeneratorMode, platform = process.platform) => (mode === 'active' || platform === 'darwin' ? 2 : 1);

/** Rest after each clip in low mode, as a share of its time: none on the efficiency cores, half the time elsewhere. */
export const restFor = (mode: GeneratorMode, platform = process.platform) => (mode === 'low' && platform !== 'darwin' ? 1 : 0);

export async function supertonicMaker(voiceDir: string, threads: number): Promise<ClipMaker> {
	const tts = await loadSupertonic(voiceDir, threads);
	return async (word, speed, fp) => {
		if (speed === 'normal') return encodeMp3(halveRate(trimSilence(await tts.speak(spoken(word), 1, seedOf(fp)), tts.sampleRate)));
		// Same take as the normal clip, then slowed at the same pitch.
		const take = trimSilence(await tts.speak(spoken(word), 1, seedOf(fingerprint(word, 'normal'))), tts.sampleRate);
		return encodeMp3(halveRate(stretch(take, 1 / SPEEDS.slow, tts.sampleRate)));
	};
}
