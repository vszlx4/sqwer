// Style worlds: complete, hand-built design directions. Each is a full DesignSpec plus a family and a radicalism score.

import type { DesignSpec, Fam } from './types';

export const DEFAULT_SPEC: DesignSpec = {
	world: 'swiss',
	name: 'Untitled direction',
	subject: 'typing',
	palette: 'swiss',
	custom: { hue: 222, sat: 0.7, light: 0.5, harmony: 'complement', spread: 0 },
	mode: 'light',
	type: 'swiss',
	scale: 1,
	tracking: 0,
	bg: 'plain',
	bgI: 0.6,
	angle: 135,
	surface: 'none',
	layout: 'split',
	features: 'grid3',
	nav: 'bar',
	button: 'solid',
	card: 'outline',
	input: 'box',
	hover: 'lift',
	art: 'geo',
	treat: 'none',
	reveal: 'fade-up',
	ease: 'out-expo',
	dur: 0.6,
	stagger: 0.07,
	radius: 4,
	border: 1,
	shadow: 'none',
	density: 1,
	width: 1240
};

export type World = {
	id: string;
	name: string;
	fam: Fam;
	/** 1 restrained … 5 radical. */
	level: 1 | 2 | 3 | 4 | 5;
	blurb: string;
	subject: string;
	spec: DesignSpec;
};

const w = (id: string, name: string, fam: Fam, level: World['level'], subject: string, blurb: string, s: Partial<DesignSpec>): World => ({
	id,
	name,
	fam,
	level,
	blurb,
	subject,
	spec: { ...DEFAULT_SPEC, world: id, name, subject, ...s }
});

export const WORLDS: World[] = [
	w('swiss', 'Swiss Grid', 'min', 1, 'studio', 'A strict grid, one grotesque, red used once. Information first, decoration never.', {
		palette: 'swiss', type: 'swiss', bg: 'grid', bgI: 0.35, layout: 'index', features: 'list', nav: 'index', button: 'solid', card: 'flat', input: 'underline', hover: 'invert', art: 'geo', radius: 0, border: 1, shadow: 'none', reveal: 'clip', ease: 'in-out', dur: 0.55
	}),
	w('nordic', 'Nordic Quiet', 'min', 1, 'product', 'Pale light, birch and sage, rounded corners, a lot of air.', {
		palette: 'fjord', type: 'iowan-futura', bg: 'paper', bgI: 0.35, layout: 'split', features: 'grid3', nav: 'minimal', button: 'pill', card: 'flat', input: 'pill', hover: 'lift', art: 'landscape', treat: 'none', radius: 18, border: 0, shadow: 'soft', density: 1.15, reveal: 'fade-up', ease: 'out-soft', dur: 0.8
	}),
	w('ma', 'Ma (間)', 'min', 2, 'kitchen', 'Japanese restraint: washi, ink, one vermilion seal, vertical type and silence.', {
		palette: 'washi', type: 'baskerville', bg: 'washi', bgI: 0.6, layout: 'vertical', features: 'rules', nav: 'minimal', button: 'stamp', card: 'ruled', input: 'underline', hover: 'underline', art: 'orbital', treat: 'none', radius: 0, border: 1, shadow: 'none', density: 1.3, reveal: 'blur', ease: 'out-soft', dur: 1.1
	}),
	w('broadsheet', 'Broadsheet', 'min', 2, 'observatory', 'Newsprint columns, rules, small caps and a serif that has read the paper.', {
		palette: 'sepia', type: 'charter', bg: 'newsprint', bgI: 0.5, layout: 'editorial', features: 'rules', nav: 'centered', button: 'underline', card: 'ruled', input: 'underline', hover: 'underline', art: 'halftone', treat: 'mono', surface: 'paper', radius: 0, border: 1, shadow: 'none', reveal: 'fade-up', ease: 'out-soft', dur: 0.6
	}),
	w('maison', 'Maison', 'ele', 2, 'atelier', 'Bone paper, brass, a Didone at a whisper, long pauses between sections.', {
		palette: 'bone-gold', type: 'caslon-gill', bg: 'plain', bgI: 0.4, layout: 'centered', features: 'zigzag', nav: 'centered', button: 'outline', card: 'flat', input: 'underline', hover: 'underline', art: 'landscape', treat: 'frame', radius: 0, border: 1, shadow: 'none', density: 1.3, reveal: 'fade-up', ease: 'out-soft', dur: 1
	}),
	w('couture', 'Couture', 'ele', 3, 'atelier', 'Black, white and nothing between. Giant Didone, tight and heavy, cropped against the edge.', {
		palette: 'couture', type: 'didone', bg: 'plain', bgI: 0, layout: 'giant', features: 'numbered', nav: 'index', button: 'brackets', card: 'flat', input: 'underline', hover: 'invert', art: 'type', treat: 'mono', radius: 0, border: 1, shadow: 'none', reveal: 'clip', ease: 'out-expo', dur: 0.9, scale: 1.1
	}),
	w('noir', 'Noir Luxe', 'ele', 3, 'atelier', 'A dark room with one lamp: brass, burgundy and a script flourish.', {
		palette: 'noir-brass', mode: 'dark', type: 'script', bg: 'spotlight', bgI: 0.75, layout: 'overlap', features: 'list', nav: 'centered', button: 'outline', card: 'corners', input: 'underline', hover: 'glow', art: 'landscape', treat: 'duotone', surface: 'vignette', radius: 2, border: 1, shadow: 'ring', reveal: 'blur', ease: 'out-soft', dur: 1.1
	}),
	w('concrete', 'Concrete Brutalism', 'raw', 3, 'studio', 'Poured grey, thick rules, monospaced everything, one orange warning.', {
		palette: 'concrete', type: 'courier', bg: 'concrete', bgI: 0.7, layout: 'index', features: 'spec', nav: 'tabs', button: 'solid', card: 'outline', input: 'box', hover: 'shift', art: 'arch', treat: 'sharp', radius: 0, border: 3, shadow: 'none', density: 0.85, reveal: 'step', ease: 'steps', dur: 0.4
	}),
	w('neobrutal', 'Neo-Brutal Pop', 'raw', 4, 'kids', 'Yellow ground, hard shadows, thick black borders and stickers that overlap.', {
		palette: 'neo-pop', type: 'arial-black', bg: 'dots', bgI: 0.45, layout: 'sticker', features: 'bento', nav: 'tabs', button: 'offset', card: 'offset', input: 'offset', hover: 'shift', art: 'geo', treat: 'sharp', radius: 8, border: 3, shadow: 'hard', density: 0.95, reveal: 'pop', ease: 'back', dur: 0.45
	}),
	w('maximal', 'Maximalist Carnival', 'raw', 5, 'athletic', 'Clashing orange, plum and teal; patterns under patterns; nothing is empty.', {
		palette: 'carnival', type: 'rockwell', bg: 'memphis', bgI: 0.85, layout: 'sticker', features: 'strip', nav: 'pill', button: 'sticker', card: 'offset', input: 'offset', hover: 'wiggle', art: 'sunset', treat: 'duotone', radius: 14, border: 3, shadow: 'long', density: 0.85, reveal: 'pop', ease: 'bounce', dur: 0.7
	}),
	w('anti', 'Anti-Design', 'raw', 5, 'studio', 'Default Times, default blue links, rotated pieces and no apology.', {
		palette: 'anti-default', type: 'times-raw', bg: 'plain', bgI: 0, layout: 'chaos', features: 'list', nav: 'bar', button: 'bevel', card: 'outline', input: 'box', hover: 'wiggle', art: 'collage', treat: 'tilt', radius: 0, border: 2, shadow: 'none', reveal: 'none', ease: 'linear', dur: 0.2
	}),
	w('sketchbook', 'Sketchbook', 'hand', 3, 'kids', 'Pen lines on cream paper, wobbly boxes, marker headlines, doodles in the margins.', {
		palette: 'graphite', type: 'marker', bg: 'paper', bgI: 0.7, layout: 'storyboard', features: 'zigzag', nav: 'minimal', button: 'sketch', card: 'index', input: 'underline', hover: 'wiggle', art: 'sketch', treat: 'none', surface: 'paper', radius: 6, border: 2, shadow: 'none', reveal: 'pop', ease: 'back', dur: 0.5
	}),
	w('collage', 'Torn Collage', 'hand', 4, 'studio', 'Cut paper, tape, halftone, a typewriter caption; everything slightly crooked.', {
		palette: 'cutout', type: 'typewriter', bg: 'newsprint', bgI: 0.55, layout: 'chaos', features: 'bento', nav: 'tabs', button: 'stamp', card: 'paper', input: 'offset', hover: 'wiggle', art: 'collage', treat: 'tilt', surface: 'paper', radius: 2, border: 2, shadow: 'soft', reveal: 'pop', ease: 'back', dur: 0.5
	}),
	w('clay', 'Clay & Pastel', 'hand', 2, 'kids', 'Soft, puffed surfaces in sorbet colours. Everything looks pressed from dough.', {
		palette: 'clay', type: 'rounded', bg: 'bokeh', bgI: 0.5, layout: 'centered', features: 'bento', nav: 'pill', button: 'pill', card: 'clay', input: 'pill', hover: 'scale', art: 'blob', treat: 'none', radius: 28, border: 0, shadow: 'inset', density: 1.1, reveal: 'pop', ease: 'spring', dur: 0.8
	}),
	w('storybook', 'Storybook', 'fun', 2, 'kids', 'Round, bright and friendly: primary colours, chalk letters, scenes you can wander through.', {
		palette: 'storybook', type: 'chalkboard', bg: 'clouds', bgI: 0.55, layout: 'storyboard', features: 'grid3', nav: 'pill', button: 'sticker', card: 'clay', input: 'pill', hover: 'wiggle', art: 'cartoon', treat: 'none', radius: 22, border: 3, shadow: 'hard', reveal: 'pop', ease: 'spring', dur: 0.7
	}),
	w('classroom', 'Bright Classroom', 'fun', 2, 'typing', 'Squared notebook paper, highlighter yellow and teacher-red margin notes.', {
		palette: 'highlighter', type: 'typewriter', bg: 'graph', bgI: 0.5, layout: 'sidebar', features: 'numbered', nav: 'tabs', button: 'offset', card: 'index', input: 'underline', hover: 'shift', art: 'sketch', treat: 'none', radius: 4, border: 2, shadow: 'none', reveal: 'slide', ease: 'out-soft', dur: 0.5
	}),
	w('poster', 'Stadium Poster', 'sport', 4, 'athletic', 'Condensed capitals, a diagonal block of red, a photograph cut to a shape.', {
		palette: 'stadium', type: 'impact', bg: 'halftone', bgI: 0.55, layout: 'poster', features: 'numbered', nav: 'tabs', button: 'offset', card: 'offset', input: 'box', hover: 'shift', art: 'halftone', treat: 'duotone', radius: 0, border: 3, shadow: 'hard', reveal: 'slide', ease: 'out-expo', dur: 0.55
	}),
	w('kinetic', 'Kinetic Volt', 'sport', 4, 'athletic', 'Black ground, acid lime, huge stretched type and a marquee that never stops.', {
		palette: 'volt', mode: 'dark', type: 'flex-wide', bg: 'stripes', bgI: 0.4, layout: 'giant', features: 'strip', nav: 'pill', button: 'glow', card: 'outline', input: 'box', hover: 'invert', art: 'type', treat: 'sharp', radius: 999, border: 2, shadow: 'none', reveal: 'slide', ease: 'out-expo', dur: 0.6, scale: 1.05
	}),
	w('cyber', 'Neon Grid', 'tech', 4, 'product', 'Magenta and cyan on near-black; a floor of light running to a horizon.', {
		palette: 'neon-grid', mode: 'dark', type: 'geist-neue', bg: 'perspective', bgI: 0.8, layout: 'hud', features: 'bento', nav: 'prompt', button: 'glow', card: 'corners', input: 'terminal', hover: 'glow', art: 'orbital', treat: 'sharp', surface: 'scanlines', radius: 0, border: 1, shadow: 'glow', reveal: 'step', ease: 'steps', dur: 0.4
	}),
	w('terminal', 'Phosphor Terminal', 'tech', 3, 'typing', 'Green on black, a prompt that types, a window that glows faintly.', {
		palette: 'phosphor', mode: 'dark', type: 'menlo', bg: 'scanlines', bgI: 0.5, layout: 'terminal', features: 'spec', nav: 'prompt', button: 'brackets', card: 'window', input: 'terminal', hover: 'invert', art: 'terminal', treat: 'none', surface: 'crt', radius: 0, border: 1, shadow: 'glow', density: 0.9, reveal: 'type', ease: 'steps', dur: 0.8
	}),
	w('generative', 'Generative Field', 'tech', 2, 'observatory', 'White, black ink and one signal red; lines grown from a vector field.', {
		palette: 'generative', type: 'altera-mono', bg: 'flow', bgI: 0.6, layout: 'overlap', features: 'bento', nav: 'minimal', button: 'brackets', card: 'corners', input: 'underline', hover: 'underline', art: 'flow', treat: 'none', radius: 0, border: 1, shadow: 'none', reveal: 'clip', ease: 'out-expo', dur: 0.9
	}),
	w('deep-space', 'Deep Space Console', 'tech', 3, 'observatory', 'Navy, ice-blue instrumentation, corner brackets and live readouts.', {
		palette: 'deep-space', mode: 'dark', type: 'geist-neue', bg: 'stars', bgI: 0.75, layout: 'hud', features: 'spec', nav: 'prompt', button: 'brackets', card: 'corners', input: 'terminal', hover: 'glow', art: 'orbital', treat: 'none', surface: 'vignette', radius: 2, border: 1, shadow: 'none', reveal: 'blur', ease: 'out-expo', dur: 0.8
	}),
	w('seventies', 'Seventies Sunburst', 'retro', 3, 'kitchen', 'Burnt orange, mustard and brown; slab serifs, sunsets and rounded shapes.', {
		palette: 'seventies', type: 'rockwell', bg: 'sunburst', bgI: 0.5, layout: 'centered', features: 'grid3', nav: 'centered', button: 'pill', card: 'paper', input: 'pill', hover: 'scale', art: 'sunset', treat: 'none', surface: 'grain', radius: 20, border: 2, shadow: 'soft', reveal: 'fade-up', ease: 'out-soft', dur: 0.7
	}),
	w('arcade', 'Pixel Arcade', 'retro', 4, 'kids', 'Eight-bit sunsets, hard steps, chunky borders on a midnight purple screen.', {
		palette: 'arcade', mode: 'dark', type: 'menlo', bg: 'checker', bgI: 0.35, layout: 'sticker', features: 'strip', nav: 'tabs', button: 'bevel', card: 'window', input: 'bevel', hover: 'shift', art: 'pixel', treat: 'sharp', radius: 0, border: 3, shadow: 'long', reveal: 'step', ease: 'steps', dur: 0.4
	}),
	w('early-web', 'Early Web 1998', 'retro', 4, 'studio', 'Grey bevels, blue links, tiled backgrounds and a visitor counter.', {
		palette: 'win98', type: 'web-1998', bg: 'plain', bgI: 0, layout: 'sidebar', features: 'list', nav: 'tabs', button: 'bevel', card: 'window', input: 'bevel', hover: 'none', art: 'pixel', treat: 'none', radius: 0, border: 2, shadow: 'none', density: 0.8, reveal: 'none', ease: 'linear', dur: 0.2
	}),
	w('diner', 'Roadside Diner', 'retro', 3, 'kitchen', 'Mint and tomato, chrome-edged badges and a humanist sign painter’s sans.', {
		palette: 'diner', type: 'trebuchet', bg: 'checker', bgI: 0.3, layout: 'sticker', features: 'grid3', nav: 'pill', button: 'sticker', card: 'offset', input: 'pill', hover: 'wiggle', art: 'sunset', treat: 'none', radius: 14, border: 3, shadow: 'hard', reveal: 'pop', ease: 'back', dur: 0.5
	}),
	w('botanical', 'Earthy Botanical', 'org', 2, 'kitchen', 'Terracotta, moss and cream; pressed-leaf drawings and a warm serif.', {
		palette: 'terracotta', type: 'cochin-optima', bg: 'paper', bgI: 0.5, layout: 'overlap', features: 'zigzag', nav: 'centered', button: 'pill', card: 'paper', input: 'underline', hover: 'lift', art: 'botanical', treat: 'grain', surface: 'paper', radius: 16, border: 1, shadow: 'soft', density: 1.15, reveal: 'fade-up', ease: 'out-soft', dur: 0.9
	}),
	w('dream', 'Dreamscape', 'org', 3, 'product', 'A haze of lilac and pink with a moving aurora behind soft rounded glass.', {
		palette: 'dream-haze', type: 'cochin-optima', bg: 'aurora', bgI: 0.7, layout: 'centered', features: 'bento', nav: 'pill', button: 'pill', card: 'frosted', input: 'pill', hover: 'glow', art: 'blob', treat: 'none', radius: 24, border: 1, shadow: 'soft', density: 1.15, reveal: 'blur', ease: 'out-soft', dur: 1
	}),
	w('dusk', 'Atmospheric Dusk', 'org', 2, 'atelier', 'A grainy gradient from plum to apricot and an italic serif at sunset.', {
		palette: 'dusk', mode: 'dark', type: 'altera-neue', bg: 'grain-gradient', bgI: 0.8, layout: 'cover', features: 'list', nav: 'minimal', button: 'outline', card: 'frosted', input: 'underline', hover: 'underline', art: 'landscape', treat: 'grain', surface: 'grain', radius: 6, border: 1, shadow: 'none', density: 1.15, reveal: 'blur', ease: 'out-soft', dur: 1.1
	}),
	w('corporate', 'Corporate Clarity', 'corp', 1, 'product', 'Blue, white and plainly organised: the interface you trust with an invoice.', {
		palette: 'ledger', type: 'newyork-sf', bg: 'plain', bgI: 0.3, layout: 'split', features: 'grid3', nav: 'bar', button: 'solid', card: 'outline', input: 'box', hover: 'lift', art: 'dashboard', treat: 'none', radius: 8, border: 1, shadow: 'soft', reveal: 'fade-up', ease: 'out-expo', dur: 0.5
	}),
	w('data-desk', 'Data Desk', 'corp', 2, 'observatory', 'Small type, tight rows, monospaced numerals and a chart wherever there is room.', {
		palette: 'data-desk', type: 'geist-neue', bg: 'graph', bgI: 0.35, layout: 'sidebar', features: 'spec', nav: 'bar', button: 'outline', card: 'outline', input: 'box', hover: 'invert', art: 'dashboard', treat: 'none', radius: 3, border: 1, shadow: 'none', density: 0.75, reveal: 'none', ease: 'out-expo', dur: 0.3, scale: 0.9
	}),
	w('blueprint', 'Architectural Blueprint', 'corp', 3, 'studio', 'White line on drafting blue, dimension marks, axonometric drawings.', {
		palette: 'blueprint', mode: 'dark', type: 'geist-neue', bg: 'blueprint', bgI: 0.7, layout: 'index', features: 'spec', nav: 'index', button: 'brackets', card: 'corners', input: 'terminal', hover: 'invert', art: 'arch', treat: 'none', radius: 0, border: 1, shadow: 'none', reveal: 'clip', ease: 'in-out', dur: 0.7
	}),
	w('brutal-editorial', 'Brutal Editorial', 'raw', 3, 'observatory', 'A magazine that lost its patience: serif italic headlines in a thick-ruled grid.', {
		palette: 'chalk', type: 'altera-mono', bg: 'newsprint', bgI: 0.4, layout: 'editorial', features: 'numbered', nav: 'tabs', button: 'solid', card: 'outline', input: 'box', hover: 'invert', art: 'halftone', treat: 'mono', radius: 0, border: 3, shadow: 'none', reveal: 'clip', ease: 'out-expo', dur: 0.6
	}),
	w('terminal-garden', 'Terminal Garden', 'tech', 3, 'kitchen', 'A shell prompt in a vegetable patch: mono type, moss greens and pressed leaves.', {
		palette: 'terminal-garden', mode: 'dark', type: 'altera-mono', bg: 'contour', bgI: 0.55, layout: 'terminal', features: 'zigzag', nav: 'prompt', button: 'brackets', card: 'window', input: 'terminal', hover: 'underline', art: 'botanical', treat: 'none', radius: 4, border: 1, shadow: 'none', reveal: 'type', ease: 'steps', dur: 0.8
	}),
	w('playful-luxe', 'Playful Luxe', 'ele', 3, 'atelier', 'Fashion-house serif meets stickers: rose, gold and a joke in the corner.', {
		palette: 'playful-luxe', type: 'didone', bg: 'bokeh', bgI: 0.5, layout: 'sticker', features: 'bento', nav: 'centered', button: 'sticker', card: 'frosted', input: 'pill', hover: 'wiggle', art: 'cartoon', treat: 'frame', radius: 18, border: 1, shadow: 'soft', reveal: 'pop', ease: 'spring', dur: 0.8
	})
];

export const WORLD_BY_ID = Object.fromEntries(WORLDS.map((x) => [x.id, x])) as Record<string, World>;
