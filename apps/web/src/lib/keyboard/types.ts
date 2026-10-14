import type { Finger } from '@sqwer/layouts';

/** Finger colouring for one key on a finger map. */
export interface ZoneInfo {
	finger: Finger;
	/** 0–1, how sure we are about this finger. */
	strength: number;
}
