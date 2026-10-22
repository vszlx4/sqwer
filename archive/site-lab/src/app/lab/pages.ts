// The lab's page map, shared by the rail, the home page and the sitemap-style index.

export type LabPage = { href: string; label: string; note: string; group: 'Explore' | 'Study' | 'Make' };

export const LAB_PAGES: LabPage[] = [
	{ href: '/lab', label: 'Home', group: 'Explore', note: 'The map of the lab.' },
	{ href: '/lab/styles', label: 'Style gallery', group: 'Explore', note: 'Complete design worlds, each rendered live and fully editable.' },
	{ href: '/lab/blueprints', label: 'Page blueprints', group: 'Explore', note: 'Ten complete page types under any design.' },
	{ href: '/lab/components', label: 'Component lab', group: 'Study', note: 'Buttons, forms, cards, menus, tables, dialogs and more, with every state.' },
	{ href: '/lab/typography', label: 'Typography', group: 'Study', note: 'Pairings, scales, a variable-font playground and text effects.' },
	{ href: '/lab/colour', label: 'Colour', group: 'Study', note: 'Palettes in light and dark, a generator, and a contrast checker.' },
	{ href: '/lab/backgrounds', label: 'Backgrounds', group: 'Study', note: 'Grounds from grain to shaders.' },
	{ href: '/lab/motion', label: 'Motion', group: 'Study', note: 'Reveals, hovers, easing, morphing and loading states.' },
	{ href: '/lab/assets', label: 'Assets', group: 'Study', note: 'Procedural illustration, icons, ornaments and textures.' },
	{ href: '/lab/layouts', label: 'Layouts', group: 'Study', note: 'Fifteen compositions and the grids behind them.' },
	{ href: '/lab/mixer', label: 'Design mixer', group: 'Make', note: 'Combine, lock, randomise and compare directions.' },
	{ href: '/lab/workbench', label: 'Workbench', group: 'Make', note: 'Tune one design on a complete page.' },
	{ href: '/lab/saved', label: 'Saved', group: 'Make', note: 'Your designs, collections, favourites and exports.' }
];
