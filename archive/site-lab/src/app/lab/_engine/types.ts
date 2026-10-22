// The design model. One DesignSpec is a complete visual direction; every lab page renders the same spec.

import type { CustomColour } from './color';

export type Fam = 'min' | 'ele' | 'raw' | 'hand' | 'fun' | 'sport' | 'tech' | 'retro' | 'org' | 'corp';

export const FAMILIES: { id: Fam; name: string; note: string }[] = [
	{ id: 'min', name: 'Minimal', note: 'Swiss, Scandinavian, Japanese, editorial' },
	{ id: 'ele', name: 'Elegant', note: 'Luxurious, sophisticated, high-fashion' },
	{ id: 'raw', name: 'Raw', note: 'Brutalist, neo-brutalist, maximalist, anti-design' },
	{ id: 'hand', name: 'Handmade', note: 'Sketchy, illustrated, collage, tactile' },
	{ id: 'fun', name: 'Playful', note: 'Cartoon, children’s, educational' },
	{ id: 'sport', name: 'Energetic', note: 'Motivational, athletic, poster' },
	{ id: 'tech', name: 'Futuristic', note: 'Cyberpunk, sci-fi, terminal, generative' },
	{ id: 'retro', name: 'Retro', note: 'Vintage, nostalgic, pixel, early web' },
	{ id: 'org', name: 'Organic', note: 'Earthy, dreamy, atmospheric' },
	{ id: 'corp', name: 'Professional', note: 'Corporate, data-driven, architectural' }
];

/** Families that sit next to each other, used to keep random mixes coherent at low intensity. */
export const NEIGHBOURS: Record<Fam, Fam[]> = {
	min: ['ele', 'corp', 'org'],
	ele: ['min', 'org', 'retro'],
	raw: ['sport', 'hand', 'retro'],
	hand: ['fun', 'org', 'raw'],
	fun: ['hand', 'sport', 'retro'],
	sport: ['raw', 'fun', 'tech'],
	tech: ['corp', 'sport', 'retro'],
	retro: ['fun', 'ele', 'raw'],
	org: ['min', 'hand', 'ele'],
	corp: ['min', 'tech', 'org']
};

export type Mode = 'light' | 'dark';

export interface DesignSpec {
	/** The world this started from; shown as the origin of a mix. */
	world: string;
	name: string;
	subject: string;
	palette: string;
	custom: CustomColour;
	mode: Mode;
	type: string;
	scale: number;
	tracking: number;
	bg: string;
	bgI: number;
	angle: number;
	surface: string;
	layout: string;
	features: string;
	nav: string;
	button: string;
	card: string;
	input: string;
	hover: string;
	art: string;
	treat: string;
	reveal: string;
	ease: string;
	dur: number;
	stagger: number;
	radius: number;
	border: number;
	shadow: string;
	density: number;
	width: number;
}

export type Opt = { id: string; name: string; fams?: Fam[]; note?: string };

export type ChoiceDim = { kind: 'choice'; key: keyof DesignSpec; label: string; group: string; opts: Opt[] };
export type RangeDim = { kind: 'range'; key: keyof DesignSpec; label: string; group: string; min: number; max: number; step: number; unit?: string; digits?: number };
export type Dim = ChoiceDim | RangeDim;

export type Saved = { id: string; name: string; spec: DesignSpec; at: number; collection?: string; note?: string };
