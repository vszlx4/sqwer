// Motion tokens; values from docs/design MOTION.md. Durations in seconds (GSAP units).

/** Cubic-bezier control points [x1, y1, x2, y2]. */
export type Curve = readonly [number, number, number, number];

export const EASES = {
	'out-expo': [0.16, 1, 0.3, 1],
	'out-soft': [0.2, 0.7, 0.2, 1],
	'out-pop': [0.2, 0.8, 0.2, 1],
	spring: [0.3, 1.6, 0.5, 1],
	'spring-soft': [0.34, 1.56, 0.64, 1],
	'in-quick': [0.4, 0, 1, 1]
} as const satisfies Record<string, Curve>;

export type EaseName = keyof typeof EASES;

export const DURATIONS = {
	instant: 0.07,
	fast: 0.14,
	base: 0.22,
	slow: 0.4,
	reveal: 0.7
} as const;

export type DurationName = keyof typeof DURATIONS;

/** Stagger steps between siblings, in seconds. */
export const STAGGER = {
	tight: 0.04,
	base: 0.07,
	loose: 0.12
} as const;

/** CSS form of a curve, for transitions that stay in CSS. */
export function cssEase(name: EaseName): string {
	return `cubic-bezier(${EASES[name].join(', ')})`;
}

/** Point on a cubic-bezier easing at progress t (0 to 1); used to check registered eases. */
export function bezier([x1, y1, x2, y2]: Curve, t: number): number {
	const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
	// Solve x(s) = t by bisection; x is monotonic for x1, x2 in [0, 1].
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		if (at(x1, x2, mid) < t) lo = mid;
		else hi = mid;
	}
	return at(y1, y2, (lo + hi) / 2);
}
