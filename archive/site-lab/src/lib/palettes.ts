// Colour palettes for exploring the new design. A palette sets the core tokens for light and dark;
// it combines with the theme (light, dark, system). Supporting, finger and chart colours stay as they are.
// One definition feeds the CSS (paletteCss), the picker swatches and WebGL components (useTokens).
// Ultramarine is the chosen direction and the default; the others stay for comparison in the lab.

export type CoreTokens = {
	accent: string;
	'on-accent': string;
	bg: string;
	surface: string;
	'surface-2': string;
	line: string;
	'line-strong': string;
	ink: string;
	'ink-2': string;
	'ink-3': string;
	untyped: string;
};

export type Palette = { id: string; name: string; mood: string; light: CoreTokens; dark: CoreTokens };

export const PALETTES = [
	{
		id: 'ultramarine',
		name: 'Ultramarine',
		mood: 'The chosen direction: porcelain paper, deep navy night, ultramarine',
		light: { accent: '#3355FF', 'on-accent': '#FFFFFF', bg: '#F6F7FB', surface: '#ECEEF6', 'surface-2': '#E1E4F0', line: '#D6DAE8', 'line-strong': '#BCC2D6', ink: '#0E1120', 'ink-2': '#4A5068', 'ink-3': '#5E6480', untyped: '#8E94AC' },
		dark: { accent: '#7088FF', 'on-accent': '#050714', bg: '#05060D', surface: '#0D1020', 'surface-2': '#151A30', line: '#1F2540', 'line-strong': '#2C3354', ink: '#EEF0FA', 'ink-2': '#A3A9C4', 'ink-3': '#9298B6', untyped: '#5F6584' }
	},
	{
		id: 'lime',
		name: 'Lime',
		mood: 'The previous sqwer: cream paper, true black, electric lime',
		light: { accent: '#CCF900', 'on-accent': '#111111', bg: '#FBFAF4', surface: '#F4F2E8', 'surface-2': '#EBE8DB', line: '#DEDAC9', 'line-strong': '#C9C4B0', ink: '#141414', 'ink-2': '#55534B', 'ink-3': '#6B685E', untyped: '#8F8B7E' },
		dark: { accent: '#CCF900', 'on-accent': '#111111', bg: '#000000', surface: '#0E0E0E', 'surface-2': '#171717', line: '#242424', 'line-strong': '#333333', ink: '#F2F2EE', 'ink-2': '#A8A8A1', 'ink-3': '#9A9A93', untyped: '#6E6E68' }
	},
	{
		id: 'ember',
		name: 'Ember',
		mood: 'Warm and energetic: parchment, charred brown-black, signal orange',
		light: { accent: '#EE5218', 'on-accent': '#1A0A00', bg: '#FBF6F0', surface: '#F4ECE2', 'surface-2': '#EBE0D2', line: '#E0D3C2', 'line-strong': '#CDBBA5', ink: '#1A120C', 'ink-2': '#5C4D40', 'ink-3': '#6E5E50', untyped: '#9A8A7A' },
		dark: { accent: '#FF6B35', 'on-accent': '#1A0A00', bg: '#0C0805', surface: '#160F0A', 'surface-2': '#201710', line: '#2E2219', 'line-strong': '#3E2F23', ink: '#F7EEE6', 'ink-2': '#B8A898', 'ink-3': '#A89686', untyped: '#6F6153' }
	},
	{
		id: 'moss',
		name: 'Moss',
		mood: 'Calm and focused: sage paper, forest night, deep green turning mint',
		light: { accent: '#1E7A4C', 'on-accent': '#FFFFFF', bg: '#F4F5EE', surface: '#E9ECE0', 'surface-2': '#DEE2D2', line: '#D2D7C3', 'line-strong': '#B8BFA6', ink: '#12160E', 'ink-2': '#4B5343', 'ink-3': '#5D6654', untyped: '#8A927D' },
		dark: { accent: '#5BE38F', 'on-accent': '#04140A', bg: '#050805', surface: '#0C120C', 'surface-2': '#141C14', line: '#1E2A1E', 'line-strong': '#2A3A2A', ink: '#EDF2EA', 'ink-2': '#A5B09F', 'ink-3': '#94A08D', untyped: '#5E6A58' }
	},
	{
		id: 'orchid',
		name: 'Orchid',
		mood: 'Playful and bold: blush paper, plum night, hot pink',
		light: { accent: '#D42578', 'on-accent': '#FFFFFF', bg: '#FBF6FA', surface: '#F4EAF2', 'surface-2': '#EBDDE8', line: '#E2D0DD', 'line-strong': '#CDB4C6', ink: '#1B0F19', 'ink-2': '#5C4857', 'ink-3': '#6E5869', untyped: '#9C8597' },
		dark: { accent: '#FF5FAE', 'on-accent': '#1A0410', bg: '#0B0509', surface: '#150B12', 'surface-2': '#1F111B', line: '#2D1A28', 'line-strong': '#3D2436', ink: '#F8EEF5', 'ink-2': '#BBA4B5', 'ink-3': '#AC93A6', untyped: '#6E5868' }
	},
	{
		id: 'mono',
		name: 'Mono',
		mood: 'Editorial and strict: pure white, pure black, no colour at all',
		light: { accent: '#0A0A0A', 'on-accent': '#FFFFFF', bg: '#FFFFFF', surface: '#F5F5F5', 'surface-2': '#EBEBEB', line: '#E2E2E2', 'line-strong': '#CACACA', ink: '#0A0A0A', 'ink-2': '#525252', 'ink-3': '#636363', untyped: '#9A9A9A' },
		dark: { accent: '#FAFAFA', 'on-accent': '#0A0A0A', bg: '#000000', surface: '#0D0D0D', 'surface-2': '#171717', line: '#232323', 'line-strong': '#333333', ink: '#FAFAFA', 'ink-2': '#A3A3A3', 'ink-3': '#949494', untyped: '#5C5C5C' }
	}
] as const satisfies readonly Palette[];

export type PaletteId = (typeof PALETTES)[number]['id'];

export const DEFAULT_PALETTE: PaletteId = 'ultramarine';
export const PALETTE_KEY = 'sqwer:palette';

export function getPalette(id: string | null | undefined): Palette {
	return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

const block = (tokens: CoreTokens) =>
	Object.entries(tokens)
		.map(([k, v]) => `--${k}:${v};`)
		.join('');

/**
 * CSS for every palette except the default (whose values are already in globals.css). Selectors outrank the
 * theme rules in globals.css, and the system-dark rule comes last so it wins when no theme is forced.
 */
export function paletteCss(): string {
	return PALETTES.filter((p) => p.id !== DEFAULT_PALETTE)
		.map((p) => {
			const sel = `:root[data-palette='${p.id}']`;
			return [
				`${sel}:not([data-theme='dark']){${block(p.light)}}`,
				`${sel}[data-theme='dark']{${block(p.dark)}}`,
				`@media (prefers-color-scheme: dark){${sel}:not([data-theme='light']){${block(p.dark)}}}`
			].join('');
		})
		.join('');
}

/** Page background per palette and mode, for the theme-color meta tag. */
export const PALETTE_BG = Object.fromEntries(PALETTES.map((p) => [p.id, { light: p.light.bg, dark: p.dark.bg }]));

