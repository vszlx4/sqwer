// Wheel speed along the hero takeover track (takeover.ts); kept apart so it tests without the DOM.

/** Wheel speed by timeline position: quick while the button fills the screen, held back while the line swells and
    takes its colors, quicker again as the letters float away, then normal. Linear between points. */
export const PACE: readonly (readonly [number, number])[] = [
	[0, 3],
	[0.3, 3],
	[0.4, 0.32],
	[0.84, 0.32],
	[0.88, 2],
	[0.97, 2],
	[1, 1]
];

/** Wheel speed at timeline progress `p`; normal outside the track. */
export function pace(p: number): number {
	if (p < 0 || p > 1) return 1;
	for (let i = 1; i < PACE.length; i++) {
		const [x1, v1] = PACE[i];
		if (p > x1) continue;
		const [x0, v0] = PACE[i - 1];
		return x1 === x0 ? v1 : v0 + ((v1 - v0) * (p - x0)) / (x1 - x0);
	}
	return 1;
}
