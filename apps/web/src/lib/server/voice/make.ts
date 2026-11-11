/* One Supertonic clip: respelled text, seeded noise, silence trimmed, halved rate, MP3. */

import { availableParallelism } from 'node:os';
import { trimSilence } from '../voice-audio.ts';
import { SPEEDS, seedOf, spoken } from './clips.ts';
import type { ClipMaker } from './generator.ts';
import { encodeMp3, halveRate } from './mp3.ts';
import type { GeneratorMode } from './settings.ts';
import { loadSupertonic } from './supertonic.ts';

/** Threads for a mode: one in low mode, all cores but one in active mode. */
export const threadsFor = (mode: GeneratorMode) => (mode === 'low' ? 1 : Math.max(1, availableParallelism() - 1));

export async function supertonicMaker(voiceDir: string, threads: number): Promise<ClipMaker> {
	const tts = await loadSupertonic(voiceDir, threads);
	return async (word, speed, fp) => {
		const samples = await tts.speak(spoken(word), SPEEDS[speed], seedOf(fp));
		return encodeMp3(halveRate(trimSilence(samples, tts.sampleRate)));
	};
}
