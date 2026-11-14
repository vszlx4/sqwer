/* One Supertonic clip: respelled text, seeded noise, silence trimmed, slow stretched from the normal take, halved rate, MP3. */

import { availableParallelism } from 'node:os';
import { stretch, trimSilence } from '../voice-audio.ts';
import { SPEEDS, fingerprint, seedOf, spoken } from './clips.ts';
import type { ClipMaker } from './generator.ts';
import { encodeMp3, halveRate } from './mp3.ts';
import type { GeneratorMode } from './settings.ts';
import { loadSupertonic } from './supertonic.ts';

/** Threads for a mode: one in low mode, all cores but one in active mode. */
export const threadsFor = (mode: GeneratorMode) => (mode === 'low' ? 1 : Math.max(1, availableParallelism() - 1));

export async function supertonicMaker(voiceDir: string, threads: number): Promise<ClipMaker> {
	const tts = await loadSupertonic(voiceDir, threads);
	return async (word, speed, fp) => {
		if (speed === 'normal') return encodeMp3(halveRate(trimSilence(await tts.speak(spoken(word), 1, seedOf(fp)), tts.sampleRate)));
		// Same take as the normal clip, then slowed at the same pitch.
		const take = trimSilence(await tts.speak(spoken(word), 1, seedOf(fingerprint(word, 'normal'))), tts.sampleRate);
		return encodeMp3(halveRate(stretch(take, 1 / SPEEDS.slow, tts.sampleRate)));
	};
}
