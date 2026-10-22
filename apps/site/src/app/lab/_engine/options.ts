// Every discrete choice the mixer can make. Families (fams) steer random mixes toward coherent results.

import type { Fam, Opt } from './types';

const o = (id: string, name: string, fams: Fam[], note?: string): Opt => ({ id, name, fams, note });

export const LAYOUTS: Opt[] = [
	o('split', 'Split', ['corp', 'min', 'org'], 'Text on one side, an image on the other.'),
	o('centered', 'Centred', ['ele', 'min', 'fun'], 'A single axis, headline over banner.'),
	o('giant', 'Giant type', ['ele', 'raw', 'sport'], 'The headline fills the width; everything else is small.'),
	o('editorial', 'Editorial columns', ['min', 'ele', 'retro'], 'Three columns divided by rules, like a broadsheet.'),
	o('poster', 'Poster', ['sport', 'raw'], 'Stacked capitals on a tilted block.'),
	o('overlap', 'Overlap', ['ele', 'org', 'hand'], 'An image behind the type, offset on purpose.'),
	o('index', 'Index', ['min', 'corp'], 'Numbered rows on a strict grid.'),
	o('sticker', 'Stickers', ['raw', 'fun', 'hand'], 'Badges and tiles scattered around the headline.'),
	o('terminal', 'Terminal window', ['tech', 'retro'], 'A command-line window as the hero.'),
	o('hud', 'HUD', ['tech'], 'Corner brackets and side readouts around a focal object.'),
	o('vertical', 'Vertical', ['min', 'ele'], 'Vertical title, image centred, copy at the edge.'),
	o('chaos', 'Collision', ['raw', 'hand'], 'Overlapping rotated pieces. Anti-layout.'),
	o('storyboard', 'Storyboard', ['hand', 'fun', 'org'], 'Three framed panels with captions.'),
	o('cover', 'Full-bleed cover', ['ele', 'org', 'sport'], 'Image fills the screen; type sits on top.'),
	o('sidebar', 'Sidebar', ['corp', 'tech', 'retro'], 'Left rail with navigation and facts, content to the right.')
];

export const FEATURES: Opt[] = [
	o('grid3', 'Three-up grid', ['corp', 'min', 'fun']),
	o('bento', 'Bento', ['tech', 'corp', 'fun', 'org']),
	o('list', 'Ruled list', ['min', 'ele', 'corp']),
	o('zigzag', 'Alternating', ['org', 'ele', 'hand']),
	o('strip', 'Horizontal strip', ['sport', 'fun', 'tech', 'raw']),
	o('numbered', 'Big numerals', ['raw', 'sport', 'min']),
	o('rules', 'Column rules', ['ele', 'min', 'retro']),
	o('spec', 'Spec sheet', ['tech', 'corp', 'retro'])
];

export const NAVS: Opt[] = [
	o('bar', 'Bar', ['corp', 'min', 'org']),
	o('centered', 'Centred logo', ['ele', 'min']),
	o('pill', 'Floating pill', ['fun', 'tech', 'org']),
	o('index', 'Numbered index', ['min', 'raw', 'corp']),
	o('minimal', 'Minimal', ['ele', 'min']),
	o('tabs', 'Boxed tabs', ['raw', 'retro', 'sport']),
	o('prompt', 'Prompt', ['tech', 'retro'])
];

export const BUTTONS: Opt[] = [
	o('solid', 'Solid', ['corp', 'min', 'org']),
	o('outline', 'Outline', ['min', 'ele', 'corp']),
	o('pill', 'Pill', ['fun', 'org', 'tech']),
	o('underline', 'Underline', ['ele', 'min']),
	o('offset', 'Offset shadow', ['raw', 'fun', 'sport']),
	o('sticker', 'Sticker', ['fun', 'hand', 'raw']),
	o('bevel', 'Bevel', ['retro']),
	o('brackets', 'Brackets', ['tech', 'retro', 'min']),
	o('glow', 'Glow', ['tech', 'sport']),
	o('stamp', 'Stamp', ['hand', 'retro', 'raw']),
	o('sketch', 'Sketch', ['hand', 'fun']),
	o('arrow', 'Arrow link', ['ele', 'min', 'corp'])
];

export const CARDS: Opt[] = [
	o('flat', 'Flat', ['min', 'corp', 'org']),
	o('outline', 'Outline', ['min', 'corp', 'ele']),
	o('paper', 'Paper', ['hand', 'org', 'retro']),
	o('offset', 'Offset', ['raw', 'fun', 'sport']),
	o('ruled', 'Ruled', ['ele', 'min', 'retro']),
	o('clay', 'Clay', ['fun', 'org', 'hand']),
	o('frosted', 'Frosted', ['tech', 'org', 'ele']),
	o('window', 'Window', ['retro', 'tech', 'raw']),
	o('index', 'Index card', ['hand', 'min', 'retro']),
	o('corners', 'Corner marks', ['tech', 'corp', 'ele'])
];

export const INPUTS: Opt[] = [
	o('box', 'Box', ['corp', 'min', 'sport']),
	o('underline', 'Underline', ['ele', 'min', 'org']),
	o('pill', 'Pill', ['fun', 'org', 'tech']),
	o('offset', 'Offset', ['raw', 'fun', 'hand']),
	o('terminal', 'Terminal', ['tech', 'retro']),
	o('bevel', 'Inset bevel', ['retro', 'raw'])
];

export const HOVERS: Opt[] = [
	o('lift', 'Lift', ['corp', 'min', 'fun', 'org']),
	o('invert', 'Invert', ['raw', 'min', 'sport', 'ele']),
	o('underline', 'Underline draw', ['ele', 'min']),
	o('wiggle', 'Wiggle', ['fun', 'hand']),
	o('glow', 'Glow', ['tech', 'sport']),
	o('shift', 'Shift', ['raw', 'retro', 'sport']),
	o('scale', 'Scale', ['fun', 'org', 'corp']),
	o('none', 'None', ['min', 'ele'])
];

export const REVEALS: Opt[] = [
	o('none', 'None (instant)', ['raw', 'corp', 'retro']),
	o('fade-up', 'Fade up', ['min', 'corp', 'org', 'ele']),
	o('clip', 'Clip wipe', ['ele', 'min', 'sport']),
	o('blur', 'Blur in', ['org', 'tech', 'ele']),
	o('pop', 'Pop', ['fun', 'hand', 'raw']),
	o('type', 'Typed', ['tech', 'retro']),
	o('step', 'Stepped', ['retro', 'tech', 'raw']),
	o('slide', 'Slide in', ['sport', 'raw', 'min'])
];

export const EASES: (Opt & { css: string })[] = [
	{ id: 'out-expo', name: 'Out expo', css: 'cubic-bezier(.16,1,.3,1)', fams: ['min', 'ele', 'corp', 'tech'] },
	{ id: 'out-soft', name: 'Out soft', css: 'cubic-bezier(.22,.61,.36,1)', fams: ['org', 'min', 'ele', 'corp'] },
	{ id: 'in-out', name: 'In-out', css: 'cubic-bezier(.65,0,.35,1)', fams: ['corp', 'ele', 'sport'] },
	{ id: 'back', name: 'Overshoot', css: 'cubic-bezier(.34,1.56,.64,1)', fams: ['fun', 'hand', 'sport'] },
	{
		id: 'spring',
		name: 'Spring',
		css: 'linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 19.6%, 1.077 22.4%, 1.121 25.4%, 1.149 28.9%, 1.159 33%, 1.153 36.6%, 1.121 43%, 1.062 51%, 1.02 60.5%, 1.0035 69%, 0.997 78%, 1)',
		fams: ['fun', 'org', 'hand']
	},
	{
		id: 'bounce',
		name: 'Bounce',
		css: 'linear(0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141 13.6%, 0.25, 0.391, 0.563, 0.765, 1, 0.891 40.9%, 0.848, 0.813, 0.785, 0.766, 0.754, 0.75, 0.754, 0.766, 0.785, 0.813, 0.848, 0.891 68.2%, 1 72.7%, 0.973, 0.953, 0.941, 0.938, 0.941, 0.953, 0.973, 1, 0.988, 0.984, 0.988, 1)',
		fams: ['fun', 'hand']
	},
	{ id: 'linear', name: 'Linear', css: 'linear', fams: ['tech', 'retro', 'raw'] },
	{ id: 'steps', name: 'Stepped', css: 'steps(7, end)', fams: ['retro', 'tech', 'raw'] }
];

export const SHADOWS: (Opt & { css: string })[] = [
	{ id: 'none', name: 'None', css: 'none', fams: ['min', 'ele', 'tech', 'corp'] },
	{ id: 'soft', name: 'Soft', css: '0 1px 2px color-mix(in srgb, var(--ink) 10%, transparent), 0 14px 34px -10px color-mix(in srgb, var(--ink) 28%, transparent)', fams: ['corp', 'org', 'fun', 'ele'] },
	{ id: 'hard', name: 'Hard offset', css: '6px 6px 0 var(--ink)', fams: ['raw', 'fun', 'sport', 'hand'] },
	{ id: 'long', name: 'Long', css: '1px 1px 0 var(--ink), 2px 2px 0 var(--ink), 3px 3px 0 var(--ink), 4px 4px 0 var(--ink), 5px 5px 0 var(--ink), 6px 6px 0 var(--ink), 7px 7px 0 var(--ink), 8px 8px 0 var(--ink)', fams: ['retro', 'raw'] },
	{ id: 'inset', name: 'Inset', css: 'inset 0 2px 8px color-mix(in srgb, var(--ink) 22%, transparent), inset 0 -2px 0 color-mix(in srgb, var(--bg) 70%, transparent)', fams: ['fun', 'org', 'retro'] },
	{ id: 'ring', name: 'Double ring', css: '0 0 0 4px var(--bg), 0 0 0 5px var(--ink)', fams: ['ele', 'hand', 'min'] },
	{ id: 'glow', name: 'Glow', css: '0 0 26px color-mix(in srgb, var(--accent) 60%, transparent), 0 0 2px var(--accent)', fams: ['tech', 'sport'] }
];

export const SURFACES: Opt[] = [
	o('none', 'Clean', ['min', 'corp', 'ele', 'fun']),
	o('grain', 'Film grain', ['org', 'ele', 'hand', 'retro']),
	o('paper', 'Paper fibre', ['hand', 'min', 'org']),
	o('scanlines', 'Scanlines', ['tech', 'retro']),
	o('halftone', 'Halftone', ['retro', 'raw', 'hand']),
	o('crt', 'CRT glow', ['tech', 'retro']),
	o('vignette', 'Vignette', ['ele', 'org', 'tech']),
	o('linen', 'Linen weave', ['ele', 'org', 'min'])
];

export const ARTS: Opt[] = [
	o('geo', 'Bauhaus geometry', ['min', 'raw', 'corp', 'fun']),
	o('landscape', 'Layered landscape', ['ele', 'org', 'min']),
	o('sketch', 'Pen sketch', ['hand', 'fun', 'min']),
	o('collage', 'Paper collage', ['hand', 'raw', 'retro']),
	o('pixel', 'Pixel scene', ['retro', 'tech', 'fun']),
	o('orbital', 'Orbital', ['tech', 'min', 'corp']),
	o('halftone', 'Halftone sphere', ['retro', 'raw', 'ele']),
	o('blob', 'Organic blobs', ['org', 'fun', 'ele']),
	o('arch', 'Axonometric', ['corp', 'tech', 'min']),
	o('terminal', 'Terminal screen', ['tech', 'retro']),
	o('sunset', 'Sunset stripes', ['retro', 'sport', 'org']),
	o('cartoon', 'Cartoon scene', ['fun', 'hand']),
	o('type', 'Type specimen', ['ele', 'raw', 'min', 'sport']),
	o('flow', 'Flow field', ['tech', 'min', 'org']),
	o('botanical', 'Botanical', ['org', 'ele', 'hand']),
	o('dashboard', 'Data chart', ['corp', 'tech'])
];

export const TREATS: Opt[] = [
	o('none', 'Natural', ['min', 'corp', 'ele']),
	o('duotone', 'Duotone', ['sport', 'raw', 'retro', 'ele']),
	o('mono', 'Monochrome', ['ele', 'min', 'raw']),
	o('grain', 'Grainy', ['org', 'hand', 'retro']),
	o('frame', 'Framed print', ['ele', 'hand', 'min']),
	o('tilt', 'Taped polaroid', ['hand', 'fun', 'retro']),
	o('sharp', 'Hard-edged', ['raw', 'sport', 'tech'])
];

export type BgMeta = Opt & { kind: 'css' | 'gl'; i: number };
const b = (id: string, name: string, fams: Fam[], kind: 'css' | 'gl' = 'css', i = 0.6, note?: string): BgMeta => ({ id, name, fams, kind, i, note });

export const BGS: BgMeta[] = [
	b('plain', 'Plain', ['min', 'corp', 'ele'], 'css', 0),
	b('paper', 'Paper', ['hand', 'min', 'org', 'retro'], 'css', 0.6, 'Fibrous noise over the ground colour.'),
	b('grain-gradient', 'Grain gradient', ['org', 'ele', 'retro'], 'css', 0.7, 'Two-colour wash with film grain.'),
	b('mesh', 'Mesh blobs', ['org', 'fun', 'tech'], 'css', 0.65, 'Drifting blurred colour fields.'),
	b('spotlight', 'Spotlight', ['ele', 'tech'], 'css', 0.6, 'A pool of light from above.'),
	b('bands', 'Sunset bands', ['retro', 'sport', 'org'], 'css', 0.7),
	b('grid', 'Grid', ['min', 'tech', 'corp'], 'css', 0.5, 'Fine lines on a 48 px module.'),
	b('graph', 'Graph paper', ['fun', 'hand', 'corp'], 'css', 0.55),
	b('dots', 'Dot field', ['min', 'fun', 'hand'], 'css', 0.5),
	b('halftone', 'Halftone', ['retro', 'raw', 'hand'], 'css', 0.6),
	b('stripes', 'Stripes', ['raw', 'sport', 'retro'], 'css', 0.5),
	b('checker', 'Checkerboard', ['raw', 'retro', 'fun'], 'css', 0.45),
	b('scanlines', 'Scanlines', ['tech', 'retro'], 'css', 0.55),
	b('perspective', 'Perspective grid', ['tech', 'retro'], 'css', 0.7, 'A floor receding to a horizon sun.'),
	b('stars', 'Starfield', ['tech', 'org'], 'css', 0.6),
	b('contour', 'Contour bands', ['org', 'min', 'tech'], 'css', 0.5, 'Banded noise like a topographic map.'),
	b('waves', 'Waves', ['org', 'fun', 'ele'], 'css', 0.6),
	b('flow', 'Flow lines', ['tech', 'min', 'ele'], 'css', 0.55, 'Seeded lines following a vector field.'),
	b('blueprint', 'Blueprint', ['corp', 'tech'], 'css', 0.6),
	b('concrete', 'Concrete', ['raw', 'corp'], 'css', 0.7),
	b('washi', 'Washi', ['min', 'ele', 'org'], 'css', 0.6),
	b('newsprint', 'Newsprint', ['retro', 'min', 'raw'], 'css', 0.55),
	b('crosshatch', 'Crosshatch', ['hand', 'retro', 'ele'], 'css', 0.5),
	b('sunburst', 'Sunburst', ['retro', 'sport', 'fun'], 'css', 0.55),
	b('terrazzo', 'Terrazzo', ['raw', 'fun', 'org', 'retro'], 'css', 0.7),
	b('memphis', 'Memphis confetti', ['raw', 'fun', 'retro'], 'css', 0.7),
	b('bokeh', 'Bokeh', ['org', 'ele', 'fun'], 'css', 0.6),
	b('clouds', 'Clouds', ['org', 'fun'], 'css', 0.6),
	b('aurora', 'Aurora (WebGL)', ['org', 'tech', 'ele'], 'gl', 0.7),
	b('silk', 'Silk (WebGL)', ['ele', 'org'], 'gl', 0.7),
	b('rays', 'Light rays (WebGL)', ['ele', 'tech', 'org'], 'gl', 0.7),
	b('threads', 'Threads (WebGL)', ['min', 'ele', 'tech'], 'gl', 0.7),
	b('linewaves', 'Line waves (WebGL)', ['tech', 'min'], 'gl', 0.7),
	b('particles', 'Particles (canvas)', ['tech', 'org', 'fun'], 'gl', 0.7),
	b('pixelblast', 'Pixel blast (WebGL)', ['retro', 'tech', 'fun'], 'gl', 0.7),
	b('dither', 'Dither (WebGL)', ['retro', 'tech', 'raw'], 'gl', 0.7),
	b('dotgrid', 'Dot grid (canvas)', ['min', 'tech', 'corp'], 'gl', 0.7),
	b('shapegrid', 'Shape grid (canvas)', ['min', 'corp', 'tech', 'raw'], 'gl', 0.7)
];

export const DENSITY_NAMES = ['Airy', 'Open', 'Balanced', 'Compact', 'Dense'];
