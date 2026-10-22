// The mixer's dimensions, generated from the registries so the controls can never drift from the data.

import { SUBJECTS } from './content';
import { TYPE_PAIRS } from './fonts';
import { ARTS, BGS, BUTTONS, CARDS, EASES, FEATURES, HOVERS, INPUTS, LAYOUTS, NAVS, REVEALS, SHADOWS, SURFACES, TREATS } from './options';
import { PALETTES } from './palettes';
import type { Dim, DesignSpec } from './types';

export const DIMS: Dim[] = [
	{ kind: 'choice', key: 'subject', label: 'Content', group: 'Foundation', opts: SUBJECTS.map((s) => ({ id: s.id, name: s.name, note: s.brand })) },
	{ kind: 'choice', key: 'mode', label: 'Mode', group: 'Colour', opts: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }] },
	{ kind: 'choice', key: 'palette', label: 'Palette', group: 'Colour', opts: [...PALETTES.map((p) => ({ id: p.id, name: p.name, fams: p.fams })), { id: 'custom', name: 'Custom (from colour lab)' }] },
	{ kind: 'choice', key: 'type', label: 'Typography', group: 'Typography', opts: TYPE_PAIRS.map((t) => ({ id: t.id, name: t.name, fams: t.fams, note: t.note })) },
	{ kind: 'range', key: 'scale', label: 'Type scale', group: 'Typography', min: 0.7, max: 1.4, step: 0.01, unit: '×', digits: 2 },
	{ kind: 'range', key: 'tracking', label: 'Headline tracking', group: 'Typography', min: -0.06, max: 0.2, step: 0.005, unit: 'em', digits: 3 },
	{ kind: 'choice', key: 'bg', label: 'Background', group: 'Surface', opts: BGS },
	{ kind: 'range', key: 'bgI', label: 'Background intensity', group: 'Surface', min: 0, max: 1, step: 0.01, digits: 2 },
	{ kind: 'range', key: 'angle', label: 'Gradient angle', group: 'Surface', min: 0, max: 360, step: 1, unit: '°', digits: 0 },
	{ kind: 'choice', key: 'surface', label: 'Texture overlay', group: 'Surface', opts: SURFACES },
	{ kind: 'choice', key: 'layout', label: 'Hero composition', group: 'Layout', opts: LAYOUTS },
	{ kind: 'choice', key: 'features', label: 'Section layout', group: 'Layout', opts: FEATURES },
	{ kind: 'choice', key: 'nav', label: 'Navigation', group: 'Layout', opts: NAVS },
	{ kind: 'choice', key: 'button', label: 'Buttons', group: 'Components', opts: BUTTONS },
	{ kind: 'choice', key: 'card', label: 'Cards', group: 'Components', opts: CARDS },
	{ kind: 'choice', key: 'input', label: 'Inputs', group: 'Components', opts: INPUTS },
	{ kind: 'choice', key: 'hover', label: 'Hover response', group: 'Components', opts: HOVERS },
	{ kind: 'choice', key: 'art', label: 'Illustration', group: 'Imagery', opts: ARTS },
	{ kind: 'choice', key: 'treat', label: 'Image treatment', group: 'Imagery', opts: TREATS },
	{ kind: 'choice', key: 'reveal', label: 'Scroll reveal', group: 'Motion', opts: REVEALS },
	{ kind: 'choice', key: 'ease', label: 'Easing', group: 'Motion', opts: EASES },
	{ kind: 'range', key: 'dur', label: 'Duration', group: 'Motion', min: 0.1, max: 2, step: 0.05, unit: 's', digits: 2 },
	{ kind: 'range', key: 'stagger', label: 'Stagger', group: 'Motion', min: 0, max: 0.3, step: 0.01, unit: 's', digits: 2 },
	{ kind: 'range', key: 'radius', label: 'Corner radius', group: 'Shape', min: 0, max: 48, step: 1, unit: 'px', digits: 0 },
	{ kind: 'range', key: 'border', label: 'Border width', group: 'Shape', min: 0, max: 6, step: 0.5, unit: 'px', digits: 1 },
	{ kind: 'choice', key: 'shadow', label: 'Shadow', group: 'Shape', opts: SHADOWS },
	{ kind: 'range', key: 'density', label: 'Density', group: 'Shape', min: 0.6, max: 1.6, step: 0.05, unit: '×', digits: 2 },
	{ kind: 'range', key: 'width', label: 'Page width', group: 'Shape', min: 880, max: 1680, step: 20, unit: 'px', digits: 0 }
];

export const GROUPS = ['Foundation', 'Colour', 'Typography', 'Surface', 'Layout', 'Components', 'Imagery', 'Motion', 'Shape'];

export const DIM_BY_KEY = Object.fromEntries(DIMS.map((d) => [d.key, d])) as Record<string, Dim>;

/** The keys a world fully defines; `name` and `world` are labels, not design decisions. */
export const DESIGN_KEYS = DIMS.map((d) => d.key) as (keyof DesignSpec)[];

export function optionName(key: keyof DesignSpec, id: string): string {
	const d = DIM_BY_KEY[key as string];
	if (d?.kind === 'choice') return d.opts.find((o) => o.id === id)?.name ?? id;
	return id;
}
