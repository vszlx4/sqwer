/**
 * Rank art colors: metals and gems for the competitive emblems (RankEmblem), the course rank badges
 * (RankBadge) and the league chip color. These are illustration ramps, not UI tokens: RankEmblem mixes
 * them in JS to shade each facet, so they stay hex here instead of CSS variables.
 * Tiers that share a palette hue use the app.css palette values as their base (lime, cyan, orange,
 * violet, amber); metals and the remaining gems keep their own identity.
 * Podium medals are CSS tokens (--medal-* in app.css).
 */

/** light: highlight, base: body, dark: shade and chip color, deep: drop and outline. */
export type Glass = { light: string; base: string; dark: string; deep: string };

export const LEAGUE_GLASS = {
	silver: { light: '#ffffff', base: '#b8c2cd', dark: '#6c7787', deep: '#2c333d' },
	gold: { light: '#fff3b8', base: '#f2b51c', dark: '#a86a00', deep: '#4a2c00' },
	diamond: { light: '#e4f0ff', base: '#78a8f5', dark: '#2f5fc4', deep: '#0f2560' },
	// Palette lime.
	master: { light: '#f4ffc2', base: '#ccf900', dark: '#6f8a00', deep: '#2a3400' },
	// Palette cyan.
	elite: { light: '#e0fffb', base: '#3debd8', dark: '#0b8f84', deep: '#033b36' },
	champion: { light: '#ffe0fb', base: '#e04ae0', dark: '#8e1595', deep: '#3d0642' },
	// Palette violet.
	grandmaster: { light: '#efeaff', base: '#a08cff', dark: '#5a45d6', deep: '#1f1660' },
	// Palette orange.
	prodigy: { light: '#ffe4d4', base: '#ff6b1f', dark: '#b33f00', deep: '#4a1700' },
	overlord: { light: '#ffdbe3', base: '#ff2f5b', dark: '#a50a2c', deep: '#45000f' },
	// Palette amber.
	transcendent: { light: '#fff5d1', base: '#ffc72c', dark: '#b57a00', deep: '#5c3600' },
	zenith: { light: '#ffffff', base: '#eef3ff', dark: '#a9b8d6', deep: '#5d6b8a' }
} as const satisfies Record<string, Glass>;

export const UNRANKED_GLASS: Glass = { light: '#ececea', base: '#a3a39d', dark: '#5f5f5a', deep: '#2a2a28' };

/** Gloss, sparks and facet edges on every emblem and badge. */
export const ART_WHITE = '#ffffff';

/** Zenith brilliant cut: crown and pavilion facets (cool whites), shadow, outline and color flashes. */
export const ZENITH_ART = {
	crown: ['#f3f8ff', '#ffffff', '#e6efff', '#fbf3ff', '#f6fbff', '#d9e4f8'],
	pavilion: ['#e9f2ff', '#c9d8f2', '#f4fbff', '#fff7e8', '#dfe9fb', '#ffffff', '#e8fbff', '#d4e1f6', '#fdf0ff', '#dbe6f9', '#eef5ff', '#b9c9e6'],
	shadow: '#7d8fb3',
	outline: '#7a8bb0',
	flashes: ['#c7f3ff', '#ffd9f4', '#fff1c4']
} as const;

/** Course rank badges: keycap face and body gradients, level ink and halo per tier. */
export type Material = { face: [string, string]; body: [string, string]; ink: string; glow: string };

export const BADGE_MATERIALS = {
	bronze: { face: ['#f6cfa8', '#cd8752'], body: ['#9a5a2c', '#6b3a19'], ink: '#4a250c', glow: '#e9a46c' },
	silver: { face: ['#fbfcfd', '#b4bdc8'], body: ['#808b98', '#566070'], ink: '#2c333d', glow: '#d5dce4' },
	gold: { face: ['#fff0b8', '#e5a92a'], body: ['#b07408', '#7c5104'], ink: '#4b3100', glow: '#f5cd58' },
	emerald: { face: ['#b6f5da', '#1fae7b'], body: ['#0e7552', '#074d36'], ink: '#043222', glow: '#4fd6a2' },
	diamond: { face: ['#f1f8ff', '#a9b9ff'], body: ['#5363b8', '#2c3574'], ink: '#1c2257', glow: '#9fe7f5' }
} as const satisfies Record<string, Material>;

/** Crown on level-10 badges: palette lime with the tier's ink as outline. */
export const BADGE_CROWN = '#ccf900';
