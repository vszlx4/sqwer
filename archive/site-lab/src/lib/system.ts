// The Ultramarine design system: everything beside the core palette tokens (lib/palettes.ts).
// Each colour has one job. Values come in light and dark; all text-carrying colours are checked for 4.5:1
// on the page background in /lab/system. One definition feeds globals.css (via systemCss) and components.

import type { Mode } from './useTokens';

type Pair = { light: string; dark: string };

/** Supporting colours: one job each, used sparingly beside the ultramarine accent. */
export const SUPPORT = {
	sky: { job: 'Information and speed', light: '#0A6FB0', dark: '#5BBAF5' },
	teal: { job: 'Success and accuracy', light: '#0C7563', dark: '#41CFAE' },
	brass: { job: 'Stars and rewards', light: '#82620C', dark: '#E6C15E' },
	coral: { job: 'Streaks and energy', light: '#B3401F', dark: '#F5866A' },
	iris: { job: 'Ranks and progress', light: '#5646D1', dark: '#A399FF' },
	rose: { job: 'Highlights', light: '#A8336C', dark: '#F07FB4' },
	error: { job: 'Errors and wrong keys', light: '#C22636', dark: '#FF6E7A' }
} satisfies Record<string, Pair & { job: string }>;

/** Finger identity, distinct from each other and from the accent; bright enough to fill a key. */
export const FINGERS = {
	pinky: { name: 'Little finger', light: '#6E5EE6', dark: '#9C90FF' },
	ring: { name: 'Ring finger', light: '#12A088', dark: '#36C7A8' },
	middle: { name: 'Middle finger', light: '#DD6340', dark: '#F38C66' },
	index: { name: 'Index finger', light: '#2E94DE', dark: '#5CB3F3' },
	thumb: { name: 'Thumb', light: '#D9649F', dark: '#EE8DC0' }
} satisfies Record<string, Pair & { name: string }>;

/** Course rank tiers as cool metals; each has a face gradient, an ink and a glow. */
export const TIERS = {
	bronze: { name: 'Bronze', face: ['#F1CDAE', '#B9784B'], ink: '#3F1E08', glow: '#D9976A' },
	silver: { name: 'Silver', face: ['#F4F6FA', '#9AA6B8'], ink: '#26303D', glow: '#C9D2DF' },
	gold: { name: 'Gold', face: ['#F7E7B0', '#C9A24B'], ink: '#3A2A04', glow: '#E6C15E' },
	teal: { name: 'Teal', face: ['#BDF0E2', '#1E9C86'], ink: '#05302A', glow: '#41CFAE' },
	sapphire: { name: 'Sapphire', face: ['#E3E9FF', '#6E86FF'], ink: '#101A5C', glow: '#9FB0FF' }
} as const;

/** Map the course's tier ids (apps/web) onto the new metals. */
export const TIER_OF: Record<string, keyof typeof TIERS> = { bronze: 'bronze', silver: 'silver', gold: 'gold', emerald: 'teal', diamond: 'sapphire' };

/** Gradients. Ink-to-sky carries the brand; dusk is reserved for celebrations (rank up, course complete). */
export const GRADIENTS = {
	inkSky: { name: 'Ink to sky', use: 'Brand bands, the hero glow, the journey line', stops: ['#0A1240', '#1B2DB8', '#3355FF', '#5FB7FF'] },
	porcelain: { name: 'Porcelain', use: 'Light surfaces and section washes', stops: ['#F6F7FB', '#E7ECFF', '#D7E9FB'] },
	tide: { name: 'Tide', use: 'Progress, speed, data highlights', stops: ['#3355FF', '#2E94DE', '#41CFAE'] },
	dusk: { name: 'Dusk', use: 'Celebrations only', stops: ['#3355FF', '#7A5CFF', '#F07FB4', '#E6C15E'] }
} as const;

export const gradient = (stops: readonly string[], angle = 120) => `linear-gradient(${angle}deg, ${stops.join(', ')})`;

export const support = (mode: Mode) => Object.fromEntries(Object.entries(SUPPORT).map(([k, v]) => [k, v[mode]])) as Record<keyof typeof SUPPORT, string>;
export const fingers = (mode: Mode) => Object.fromEntries(Object.entries(FINGERS).map(([k, v]) => [k, v[mode]])) as Record<keyof typeof FINGERS, string>;

/** CSS variables for the supporting and finger colours, for light and dark; applied in the root layout. */
export function systemCss(): string {
	const vars = (mode: Mode) =>
		[...Object.entries(SUPPORT).map(([k, v]) => `--${k}:${v[mode]};`), ...Object.entries(FINGERS).map(([k, v]) => `--f-${k}:${v[mode]};`)].join('');
	return [
		`:root{${vars('light')}}`,
		`:root[data-theme='dark']{${vars('dark')}}`,
		`@media (prefers-color-scheme: dark){:root:not([data-theme='light']){${vars('dark')}}}`,
		`[data-scope='light']{${vars('light')}}`,
		`[data-scope='dark']{${vars('dark')}}`
	].join('');
}
