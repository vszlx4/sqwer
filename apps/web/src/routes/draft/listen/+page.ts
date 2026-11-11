import { error } from '@sveltejs/kit';

// Mockups for review on the dev server only.
export const prerender = false;

export function load() {
	if (!import.meta.env.DEV) error(404, 'Not found');
}
