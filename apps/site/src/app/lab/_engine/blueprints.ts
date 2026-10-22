// Blueprint metadata kept apart from the (client) renderers so server components can list and statically generate them.

export type BlueprintMeta = { id: string; name: string; subject: string; blurb: string; kind: string };

export const BLUEPRINT_META: BlueprintMeta[] = [
	{ id: 'landing', name: 'Landing page', subject: 'typing', kind: 'Marketing', blurb: 'Hero, proof, features, steps, gallery, quote and a closing call.' },
	{ id: 'portfolio', name: 'Portfolio', subject: 'studio', kind: 'Showcase', blurb: 'A statement, a grid of projects at alternating scales, and a short about.' },
	{ id: 'editorial', name: 'Editorial article', subject: 'observatory', kind: 'Publishing', blurb: 'Masthead, lead story with columns and a pull quote, a most-read rail.' },
	{ id: 'learn', name: 'Course page', subject: 'typing', kind: 'Education', blurb: 'Progress ring, tabs, an expandable syllabus and an enrolment card.' },
	{ id: 'product', name: 'Product page', subject: 'product', kind: 'Commerce', blurb: 'Image gallery, finish picker, quantity, add to bag, specs and questions.' },
	{ id: 'store', name: 'Storefront', subject: 'atelier', kind: 'Commerce', blurb: 'Filter chips, a product grid and a working bag count.' },
	{ id: 'agency', name: 'Creative agency', subject: 'studio', kind: 'Showcase', blurb: 'An oversized statement, a ticker and a case list that swaps the image on hover.' },
	{ id: 'restaurant', name: 'Restaurant', subject: 'kitchen', kind: 'Hospitality', blurb: 'Cover hero, menu with dotted leaders, hours and a booking form.' },
	{ id: 'event', name: 'Event', subject: 'athletic', kind: 'Events', blurb: 'Poster hero, day-tabbed programme and three ticket tiers.' },
	{ id: 'docs', name: 'Documentation', subject: 'observatory', kind: 'Reference', blurb: 'Sidebar tree, code block with copy, parameter table and an on-this-page rail.' }
];
