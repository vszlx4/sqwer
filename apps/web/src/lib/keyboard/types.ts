import type { Finger } from '@sqwer/layouts';

/** Finger colouring for one key on a finger map. */
export interface ZoneInfo {
	finger: Finger;
	/** 0–1 confidence in this finger. */
	strength: number;
}
