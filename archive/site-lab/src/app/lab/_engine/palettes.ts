// 47 palettes. Each is written once in its native mode (7 colours) and the other mode is derived, so every palette
// works in light and dark. Text pairs are held to 4.5:1 and accents to 3:1 against the background.

import { contrast, customScheme, ensureContrast, hexToHsl, hslToHex, mix, readableOn, type CustomColour, type Scheme } from './color';
import type { Fam, Mode } from './types';

export type Palette = {
	id: string;
	name: string;
	fams: Fam[];
	native: Mode;
	/** bg, surface, ink, ink2, line, accent, accent2 */
	c: [string, string, string, string, string, string, string];
};

const p = (id: string, name: string, fams: Fam[], native: Mode, c: Palette['c']): Palette => ({ id, name, fams, native, c });

export const PALETTES: Palette[] = [
	p('swiss', 'Swiss Signal', ['min', 'corp'], 'light', ['#f4f4f1', '#ffffff', '#0d0d0d', '#595955', '#d9d9d3', '#e30613', '#0057b8']),
	p('fjord', 'Fjord Mist', ['min', 'org'], 'light', ['#eef1f0', '#f9fbfa', '#1d2b2f', '#53656a', '#d2dbdb', '#3f7f8c', '#c9a66b']),
	p('washi', 'Washi & Hanko', ['min', 'ele'], 'light', ['#f2ede2', '#faf6ec', '#1b1a17', '#6b665b', '#ddd5c3', '#c5321f', '#2b3a55']),
	p('chalk', 'Chalk & Charcoal', ['min', 'raw'], 'light', ['#ededeb', '#f7f7f5', '#222426', '#66686b', '#d6d6d2', '#222426', '#8a8d92']),
	p('oat', 'Oat Milk', ['min', 'org'], 'light', ['#f1e9dc', '#f9f3e9', '#2d261d', '#7a6d5a', '#e0d4bf', '#b5651d', '#7d8f69']),
	p('bone-gold', 'Bone & Gold', ['ele'], 'light', ['#f3eee4', '#fbf8f1', '#1a1611', '#6d6354', '#dcd2bd', '#9a7430', '#5a1f2b']),
	p('noir-brass', 'Noir Brass', ['ele', 'tech'], 'dark', ['#0c0b0a', '#151311', '#efe6d4', '#a69a85', '#2a2622', '#c9a35b', '#9c3a49']),
	p('couture', 'Couture Mono', ['ele', 'min'], 'light', ['#ffffff', '#f5f5f5', '#000000', '#666666', '#dcdcdc', '#000000', '#b00020']),
	p('ivory-rose', 'Ivory Rose', ['ele', 'org'], 'light', ['#f7efe9', '#fffaf6', '#2a1c1d', '#7d6465', '#e8d6cf', '#a8475a', '#c79a6b']),
	p('emerald', 'Midnight Emerald', ['ele', 'org'], 'dark', ['#07130f', '#0d1f19', '#e7efe9', '#8fa89b', '#1b3329', '#3fbf8f', '#d7b56d']),
	p('concrete', 'Concrete', ['raw', 'corp'], 'light', ['#c9c8c4', '#dcdbd7', '#111111', '#4a4a47', '#8d8c88', '#ff4400', '#111111']),
	p('neo-pop', 'Neo Pop', ['raw', 'fun'], 'light', ['#ffe14d', '#fffdf0', '#111111', '#333333', '#111111', '#ff4fa3', '#2f6bff']),
	p('carnival', 'Carnival Clash', ['raw', 'fun'], 'light', ['#ff5a36', '#ffd23f', '#1a0b2e', '#3b1c5a', '#1a0b2e', '#00b894', '#7c3aed']),
	p('anti-default', 'Anti-Default', ['raw', 'retro'], 'light', ['#ffffff', '#f0f0f0', '#000000', '#333333', '#999999', '#0000ee', '#ff00ff']),
	p('safety', 'Safety Orange', ['raw', 'sport'], 'light', ['#f2f0ea', '#ffffff', '#121212', '#4a4a4a', '#bdbab0', '#ff6a00', '#1d1d1d']),
	p('graphite', 'Graphite & Paper', ['hand', 'min'], 'light', ['#f6f1e6', '#fffdf6', '#2b2b2b', '#6b6b6b', '#cfc8b8', '#2f55d4', '#e0453a']),
	p('cutout', 'Cutout Paper', ['hand', 'raw'], 'light', ['#efe4cf', '#fff8e8', '#1c1c1c', '#4d4435', '#bba98a', '#e4572e', '#1b998b']),
	p('clay', 'Clay Pastel', ['hand', 'org', 'fun'], 'light', ['#f3e3dc', '#fbf0eb', '#3d2b2b', '#856a6a', '#e8cfc6', '#e07a5f', '#81b29a']),
	p('storybook', 'Storybook Primaries', ['fun'], 'light', ['#fff6dc', '#ffffff', '#1f2a44', '#51608a', '#f0dfae', '#ff5e5b', '#3a86ff']),
	p('highlighter', 'Highlighter', ['fun', 'corp'], 'light', ['#fbfbf4', '#ffffff', '#1e2a3a', '#5c6b7c', '#cfe0ee', '#ffd400', '#2a9d8f']),
	p('bubblegum', 'Bubblegum', ['fun', 'org'], 'light', ['#fff0f7', '#ffffff', '#34163d', '#7d5a86', '#f6d3e6', '#ff4da6', '#6c5ce7']),
	p('stadium', 'Stadium Poster', ['sport', 'raw'], 'light', ['#f4efe6', '#ffffff', '#0a0a0a', '#3c3c3c', '#d0c9bb', '#e10600', '#0a0a0a']),
	p('volt', 'Volt', ['sport', 'tech'], 'dark', ['#0b0b0b', '#151515', '#f5f5f0', '#9a9a94', '#2a2a2a', '#d7ff00', '#ff3d00']),
	p('endurance', 'Endurance Blue', ['sport', 'corp'], 'light', ['#eef3f8', '#ffffff', '#0b1f3a', '#4a5d78', '#cfd9e6', '#0a5cff', '#ff7a1a']),
	p('phosphor', 'Phosphor', ['tech', 'retro'], 'dark', ['#020a04', '#07140a', '#b6ffc7', '#5fb577', '#12361c', '#39ff6a', '#ffd24a']),
	p('neon-grid', 'Neon Grid', ['tech'], 'dark', ['#09050f', '#130a1f', '#efe9ff', '#9b8fc4', '#2a1a45', '#ff2bd6', '#00e5ff']),
	p('deep-space', 'Deep Space', ['tech'], 'dark', ['#050a18', '#0b1430', '#e6edff', '#8ea0c9', '#1a2850', '#4cc9f0', '#ffd166']),
	p('generative', 'Generative Ink', ['tech', 'min'], 'light', ['#fbfbfb', '#ffffff', '#0a0a0a', '#6a6a6a', '#e2e2e2', '#0a0a0a', '#ff3b30']),
	p('ice-lab', 'Ice Lab', ['tech', 'corp'], 'light', ['#eaf4fb', '#f8fcff', '#0b2a3d', '#4c6c80', '#c9dfec', '#0077b6', '#00b4d8']),
	p('seventies', 'Seventies', ['retro', 'org'], 'light', ['#f4e3c1', '#fbf0d8', '#3b2314', '#7a5a3a', '#e0c99c', '#d9541e', '#e8a317']),
	p('arcade', 'Arcade', ['retro', 'fun', 'tech'], 'dark', ['#120a24', '#1c1138', '#fff3c4', '#b6a6e8', '#35235f', '#ffd23f', '#ff4f5e']),
	p('win98', 'Grey Window', ['retro', 'raw'], 'light', ['#c0c0c0', '#dfdfdf', '#000000', '#404040', '#808080', '#000080', '#008080']),
	p('diner', 'Diner Pastel', ['retro', 'fun'], 'light', ['#e8f6f3', '#ffffff', '#2b2d42', '#5f6684', '#bfe1da', '#ef476f', '#ffb703']),
	p('sepia', 'Sepia Print', ['retro', 'ele', 'min'], 'light', ['#e9dcc3', '#f3e9d4', '#2a1f14', '#6e5a41', '#cdb994', '#8b2e1f', '#2f4b3a']),
	p('terracotta', 'Terracotta Garden', ['org'], 'light', ['#f2e8dc', '#faf3e9', '#2c2a1f', '#6f6a52', '#dcccb4', '#b5532e', '#5f7a4a']),
	p('moss', 'Moss & Stone', ['org', 'min'], 'light', ['#e9ecdf', '#f5f7ee', '#1f2a1c', '#5a6a53', '#ccd4bd', '#4c6b3a', '#b08a4a']),
	p('dune', 'Dune', ['org', 'retro'], 'light', ['#f0e2cc', '#f9eedb', '#3a2b1d', '#8a7355', '#e0cba6', '#c2793a', '#6b7f6a']),
	p('dream-haze', 'Dream Haze', ['org', 'fun'], 'light', ['#f4f0ff', '#ffffff', '#2a2250', '#6e66a0', '#ddd5f7', '#8a6bff', '#ff8fb8']),
	p('dusk', 'Dusk Grain', ['org', 'ele'], 'dark', ['#1a1020', '#261833', '#fbe9e0', '#c9a3b4', '#402a4d', '#ff8a5c', '#ffc857']),
	p('tide', 'Tide Pool', ['org', 'corp'], 'light', ['#e3f1ef', '#f4fbfa', '#0e2f33', '#4d7478', '#c3dedb', '#0f8b8d', '#ee6c4d']),
	p('ledger', 'Ledger Blue', ['corp', 'min'], 'light', ['#f5f7fb', '#ffffff', '#0f1b33', '#53607d', '#dbe1ee', '#1f4fd8', '#0ea5a4']),
	p('slate', 'Slate Pro', ['corp'], 'light', ['#f3f4f6', '#ffffff', '#111827', '#4b5563', '#d9dce2', '#4f46e5', '#059669']),
	p('bankside', 'Bankside Green', ['corp', 'ele'], 'light', ['#f4f6f2', '#ffffff', '#10261b', '#4a6354', '#d5ddd0', '#0b6b3a', '#c8a44d']),
	p('blueprint', 'Blueprint', ['corp', 'tech'], 'dark', ['#0a3a78', '#0d4690', '#e8f1ff', '#a9c6ef', '#2a63ad', '#ffffff', '#ffd54a']),
	p('data-desk', 'Data Desk', ['corp', 'min'], 'light', ['#f6f6f3', '#ffffff', '#1a1a1a', '#5a5a5a', '#d8d8d2', '#d9480f', '#1971c2']),
	p('terminal-garden', 'Terminal Garden', ['tech', 'org'], 'dark', ['#0f1a12', '#16261a', '#e6f0d8', '#93a886', '#24402b', '#b6e04a', '#f08a4b']),
	p('playful-luxe', 'Playful Luxe', ['ele', 'fun'], 'light', ['#f9eef0', '#ffffff', '#2b0f1e', '#7a4a62', '#ecd0d9', '#c2185b', '#d4a017'])
];

export const PALETTE_BY_ID = Object.fromEntries(PALETTES.map((x) => [x.id, x])) as Record<string, Palette>;

const hue = (hex: string) => hexToHsl(hex);

/** Derives the opposite mode from a native scheme: same hues, flipped lightness, contrast re-checked. */
function derive(pl: Palette, target: Mode): Scheme {
	const [bg0, , ink0, , , acc, acc2] = pl.c;
	const [bh, bs] = hue(bg0);
	const [ih, is] = hue(ink0);
	const dark = target === 'dark';
	const bg = hslToHex(bh, Math.min(bs, 0.4) * 0.9, dark ? 0.075 : 0.955);
	const ink = hslToHex(ih, Math.min(is, 0.3), dark ? 0.93 : 0.08);
	return finish({
		bg,
		surface: dark ? mix(bg, ink, 0.07) : mix(bg, '#ffffff', 0.7),
		ink,
		ink2: mix(ink, bg, 0.36),
		line: mix(bg, ink, 0.17),
		accent: ensureContrast(acc, bg, 3),
		accent2: ensureContrast(acc2, bg, 3)
	});
}

function finish(s: Omit<Scheme, 'surface2' | 'onAccent'>): Scheme {
	return { ...s, surface2: mix(s.surface, s.ink, 0.06), onAccent: readableOn(s.accent) };
}

const cache = new Map<string, Scheme>();

export function resolveScheme(id: string, mode: Mode, custom?: CustomColour): Scheme {
	if (id === 'custom' && custom) return customScheme(custom, mode);
	const pl = PALETTE_BY_ID[id] ?? PALETTES[0];
	const key = pl.id + mode;
	let hit = cache.get(key);
	if (!hit) {
		hit = pl.native === mode ? finish({ bg: pl.c[0], surface: pl.c[1], ink: pl.c[2], ink2: pl.c[3], line: pl.c[4], accent: pl.c[5], accent2: pl.c[6] }) : derive(pl, mode);
		cache.set(key, hit);
	}
	return hit;
}

/** Contrast of the text pairs and the accent, for the colour lab and the sanity checks. */
export function paletteReport(s: Scheme) {
	return {
		ink: contrast(s.ink, s.bg),
		ink2: contrast(s.ink2, s.bg),
		accent: contrast(s.accent, s.bg),
		onAccent: contrast(s.onAccent, s.accent)
	};
}
