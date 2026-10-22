// Typography: the four self-hosted families plus the system faces that ship with macOS, Windows and iOS.
// Nothing is fetched from a font service. A system face that is missing falls back down its own stack.

import type { Fam } from './types';

export const STACKS = {
	altera: 'var(--font-altera-serif), "PP Altera Serif", Georgia, serif',
	neue: 'var(--font-neue-montreal), "Helvetica Neue", Helvetica, Arial, sans-serif',
	geist: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
	flex: '"Roboto Flex", var(--font-neue-montreal), "Helvetica Neue", Arial, sans-serif',
	didone: 'Didot, "Bodoni 72", "Bodoni MT", "Playfair Display", "Times New Roman", serif',
	caslon: '"Big Caslon", "Hoefler Text", Baskerville, Georgia, serif',
	baskerville: 'Baskerville, "Baskerville Old Face", "Libre Baskerville", Georgia, serif',
	palatino: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif',
	cochin: 'Cochin, "Iowan Old Style", Georgia, serif',
	iowan: '"Iowan Old Style", "New York", ui-serif, Georgia, serif',
	charter: 'Charter, "Bitstream Charter", "Iowan Old Style", Georgia, serif',
	georgia: 'Georgia, "Times New Roman", serif',
	times: '"Times New Roman", Times, serif',
	newyork: 'ui-serif, "New York", Georgia, serif',
	optima: 'Optima, Candara, "Segoe UI", sans-serif',
	futura: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif',
	gill: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif',
	avenir: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
	helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
	system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
	arialBlack: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
	impact: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
	rockwell: 'Rockwell, "Roboto Slab", "Courier New", serif',
	typewriter: '"American Typewriter", "Courier New", serif',
	courier: '"Courier New", Courier, monospace',
	menlo: 'Menlo, Monaco, "SF Mono", Consolas, monospace',
	marker: '"Marker Felt", "Comic Sans MS", "Chalkboard SE", cursive',
	noteworthy: 'Noteworthy, "Bradley Hand", "Segoe Print", cursive',
	chalkboard: '"Chalkboard SE", Chalkboard, "Comic Sans MS", cursive',
	rounded: 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", Nunito, sans-serif',
	trebuchet: '"Trebuchet MS", "Lucida Grande", sans-serif',
	verdana: 'Verdana, Geneva, sans-serif',
	copper: 'Copperplate, "Copperplate Gothic Light", fantasy',
	snell: '"Snell Roundhand", "Brush Script MT", cursive',
	papyrus: 'Papyrus, fantasy',
	comic: '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive'
} as const;

export type TypePair = {
	id: string;
	name: string;
	fams: Fam[];
	display: string;
	body: string;
	mono: string;
	/** Display weight, tracking (em), case and style. */
	dw: number;
	bw: number;
	tr: number;
	caseD: 'none' | 'uppercase' | 'lowercase';
	italic: boolean;
	/** Display line-height and hero size in container-width percent. */
	lh: number;
	hero: number;
	note: string;
};

const t = (id: string, name: string, fams: Fam[], display: keyof typeof STACKS, body: keyof typeof STACKS, mono: keyof typeof STACKS, o: Partial<TypePair> & { note: string }): TypePair => ({
	id,
	name,
	fams,
	display: STACKS[display],
	body: STACKS[body],
	mono: STACKS[mono],
	dw: 400,
	bw: 400,
	tr: 0,
	caseD: 'none',
	italic: false,
	lh: 1.02,
	hero: 7.4,
	...o
});

export const TYPE_PAIRS: TypePair[] = [
	t('altera-neue', 'Altera & Montreal', ['min', 'ele'], 'altera', 'neue', 'geist', { tr: -0.02, lh: 1.0, hero: 8, note: 'The house pairing: a calm display serif over a neutral grotesque.' }),
	t('didone', 'Didone Couture', ['ele'], 'didone', 'helvetica', 'geist', { dw: 400, tr: -0.035, lh: 0.9, hero: 11, note: 'Hairline Didot at fashion-cover scale, tight tracking.' }),
	t('caslon-gill', 'Caslon & Gill', ['ele', 'min'], 'caslon', 'gill', 'courier', { italic: true, tr: -0.01, lh: 1.02, hero: 7.6, note: 'Italic Caslon with a humanist sans for captions.' }),
	t('baskerville', 'Baskerville Quiet', ['min', 'ele'], 'baskerville', 'avenir', 'menlo', { tr: -0.015, hero: 7, note: 'Transitional serif, generous leading, restrained.' }),
	t('cochin-optima', 'Cochin & Optima', ['org', 'ele'], 'cochin', 'optima', 'menlo', { italic: true, tr: -0.01, hero: 7.4, note: 'Warm, flared and slightly literary.' }),
	t('iowan-futura', 'Iowan & Futura', ['min', 'org'], 'iowan', 'futura', 'menlo', { tr: -0.02, hero: 7.2, note: 'An old-style serif with geometric sans details.' }),
	t('charter', 'Charter Reader', ['min', 'corp'], 'charter', 'charter', 'menlo', { dw: 700, tr: -0.02, lh: 1.05, hero: 6.4, note: 'Built for reading: sturdy, even colour.' }),
	t('swiss', 'Swiss Grotesque', ['min', 'corp'], 'neue', 'neue', 'geist', { dw: 600, tr: -0.045, lh: 0.94, hero: 9.4, note: 'One grotesque, heavy and tight. The International Style.' }),
	t('futura', 'Futura Geometry', ['min', 'retro'], 'futura', 'futura', 'menlo', { dw: 700, tr: -0.02, caseD: 'uppercase', lh: 1.0, hero: 6.6, note: 'Perfect circles, capital letters, Bauhaus calm.' }),
	t('arial-black', 'Heavy Pop', ['raw', 'fun'], 'arialBlack', 'helvetica', 'courier', { dw: 900, tr: -0.03, caseD: 'uppercase', lh: 0.92, hero: 8.6, note: 'Arial Black shouted in capitals. Neo-brutal staple.' }),
	t('courier', 'Courier Concrete', ['raw', 'tech'], 'courier', 'courier', 'courier', { dw: 700, tr: -0.02, lh: 1.05, hero: 6.4, note: 'Typewriter monospace for everything.' }),
	t('impact', 'Stadium Impact', ['sport', 'raw'], 'impact', 'helvetica', 'courier', { dw: 400, tr: 0, caseD: 'uppercase', lh: 0.9, hero: 11.5, note: 'Condensed, tall, uppercase. Poster energy.' }),
	t('rockwell', 'Rockwell Seventies', ['retro', 'org'], 'rockwell', 'georgia', 'courier', { dw: 700, tr: -0.015, lh: 1.0, hero: 7.8, note: 'A slab serif with the warmth of 1970s print.' }),
	t('typewriter', 'Typewriter Draft', ['hand', 'retro', 'min'], 'typewriter', 'typewriter', 'courier', { dw: 700, tr: -0.01, lh: 1.08, hero: 6.2, note: 'Struck letters, slightly uneven, very human.' }),
	t('marker', 'Marker & Note', ['hand', 'fun'], 'marker', 'noteworthy', 'courier', { dw: 700, tr: 0, lh: 1.05, hero: 7.4, note: 'Felt-tip headlines, handwritten body.' }),
	t('chalkboard', 'Chalkboard Class', ['fun', 'hand'], 'chalkboard', 'rounded', 'courier', { dw: 700, lh: 1.05, hero: 7, note: 'Friendly chalk lettering for lessons.' }),
	t('rounded', 'Soft Rounded', ['fun', 'org'], 'rounded', 'rounded', 'menlo', { dw: 800, tr: -0.02, lh: 1.0, hero: 8, note: 'System rounded: bubbly, approachable, modern.' }),
	t('menlo', 'Terminal Mono', ['tech', 'retro'], 'menlo', 'menlo', 'menlo', { dw: 700, tr: -0.03, lh: 1.05, hero: 5.8, note: 'Everything in monospace, as a shell would.' }),
	t('geist-neue', 'Mono Over Grotesque', ['tech', 'corp'], 'geist', 'neue', 'geist', { dw: 500, tr: -0.04, caseD: 'uppercase', lh: 1.0, hero: 6.6, note: 'Geist Mono headlines for a technical register.' }),
	t('flex-wide', 'Flex Wide', ['tech', 'sport'], 'flex', 'flex', 'geist', { dw: 800, tr: -0.02, caseD: 'uppercase', lh: 0.95, hero: 7.4, note: 'Roboto Flex stretched wide and heavy.' }),
	t('web-1998', 'Times & Verdana', ['retro', 'raw'], 'times', 'verdana', 'courier', { dw: 700, lh: 1.1, hero: 5.4, note: 'Default-browser Times over Verdana, 1998.' }),
	t('times-raw', 'Default Times', ['raw'], 'times', 'times', 'courier', { dw: 400, tr: 0, lh: 1.0, hero: 9, note: 'No design. Times New Roman, enormous.' }),
	t('script', 'Script & Gill', ['ele', 'fun'], 'snell', 'gill', 'courier', { dw: 700, tr: 0, lh: 1.1, hero: 8.4, note: 'Connected script display with a clean sans.' }),
	t('copper', 'Copperplate Formal', ['ele', 'retro'], 'copper', 'gill', 'courier', { dw: 700, tr: 0.06, caseD: 'uppercase', lh: 1.1, hero: 5.8, note: 'Engraved capitals for stationery and signage.' }),
	t('altera-mono', 'Altera Italic & Mono', ['min', 'tech', 'ele'], 'altera', 'geist', 'geist', { italic: true, tr: -0.02, lh: 1.0, hero: 8, note: 'Italic serif headlines, monospace body. Editorial meets technical.' }),
	t('newyork-sf', 'New York & System', ['corp', 'min'], 'newyork', 'system', 'menlo', { dw: 600, tr: -0.02, lh: 1.04, hero: 6.8, note: 'The platform serif with the platform sans.' }),
	t('trebuchet', 'Diner Trebuchet', ['retro', 'fun'], 'trebuchet', 'verdana', 'courier', { dw: 700, tr: -0.01, lh: 1.05, hero: 7, note: 'Humanist and rounded; roadside signage.' }),
	t('papyrus', 'Papyrus & Comic', ['raw', 'fun'], 'papyrus', 'comic', 'courier', { dw: 400, lh: 1.1, hero: 7, note: 'The two fonts everybody was told never to use. On purpose.' })
];

export const TYPE_BY_ID = Object.fromEntries(TYPE_PAIRS.map((x) => [x.id, x])) as Record<string, TypePair>;

/** Faces for the typography lab specimen wall. */
export const FACES: { id: string; name: string; stack: string; kind: string }[] = [
	...(
		[
			['altera', 'PP Altera Serif', 'Self-hosted serif'],
			['neue', 'PP Neue Montreal', 'Self-hosted grotesque'],
			['geist', 'Geist Mono', 'Self-hosted monospace, variable'],
			['flex', 'Roboto Flex', 'Self-hosted, 5 variable axes'],
			['didone', 'Didot / Bodoni', 'Didone'],
			['caslon', 'Big Caslon', 'Old-style serif'],
			['baskerville', 'Baskerville', 'Transitional serif'],
			['palatino', 'Palatino', 'Humanist serif'],
			['cochin', 'Cochin', 'Flared serif'],
			['charter', 'Charter', 'Reading serif'],
			['georgia', 'Georgia', 'Screen serif'],
			['optima', 'Optima', 'Flared sans'],
			['futura', 'Futura', 'Geometric sans'],
			['gill', 'Gill Sans', 'Humanist sans'],
			['avenir', 'Avenir Next', 'Geometric humanist'],
			['helvetica', 'Helvetica Neue', 'Grotesque'],
			['arialBlack', 'Arial Black', 'Heavy grotesque'],
			['impact', 'Impact', 'Condensed display'],
			['rockwell', 'Rockwell', 'Slab serif'],
			['typewriter', 'American Typewriter', 'Typewriter slab'],
			['courier', 'Courier New', 'Monospace'],
			['menlo', 'Menlo', 'Monospace'],
			['marker', 'Marker Felt', 'Felt-tip hand'],
			['noteworthy', 'Noteworthy', 'Handwriting'],
			['chalkboard', 'Chalkboard SE', 'Chalk'],
			['rounded', 'SF Rounded', 'Rounded sans'],
			['trebuchet', 'Trebuchet MS', 'Humanist sans'],
			['copper', 'Copperplate', 'Engraved capitals'],
			['snell', 'Snell Roundhand', 'Script'],
			['papyrus', 'Papyrus', 'Display novelty']
		] as [keyof typeof STACKS, string, string][]
	).map(([k, name, kind]) => ({ id: k as string, name, stack: STACKS[k], kind }))
];

/** Roboto Flex's variable axes, for the variable-font playground. */
export const FLEX_AXES = [
	{ tag: 'wght', name: 'Weight', min: 100, max: 1000, def: 400 },
	{ tag: 'wdth', name: 'Width', min: 25, max: 151, def: 100 },
	{ tag: 'opsz', name: 'Optical size', min: 8, max: 144, def: 14 },
	{ tag: 'slnt', name: 'Slant', min: -10, max: 0, def: 0 },
	{ tag: 'GRAD', name: 'Grade', min: -200, max: 150, def: 0 },
	{ tag: 'XTRA', name: 'Counter width', min: 323, max: 603, def: 468 },
	{ tag: 'YTUC', name: 'Cap height', min: 528, max: 760, def: 712 }
];
