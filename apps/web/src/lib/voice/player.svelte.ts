/* The page's voice player: the shared audio graph and the volume kept in device settings. */

import { saveSettings, settings } from '#lib/settings.svelte.ts';
import { sound } from './audio.svelte.ts';
import { Player } from './player.ts';

export { MEMORY, type Said, type Speed, type WordState } from './player.ts';

export const voice = new Player({
	graph: () => sound.graph(),
	volume: () => settings.voiceVolume,
	saveVolume: (v) => {
		settings.voiceVolume = v;
		saveSettings();
	}
});
