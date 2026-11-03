// Breakpoints. Media queries can't read var(), so CSS writes these as literals; scripts/breakpoints.test.ts holds
// every query to this set.
export const BREAKPOINTS = {
	wide: 1100,
	desktop: 900,
	tablet: 760,
	phone: 560,
	small: 420
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Media query for widths at or below a breakpoint. */
export function below(bp: Breakpoint): string {
	return `(max-width: ${BREAKPOINTS[bp]}px)`;
}
