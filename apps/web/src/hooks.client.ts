import { dev } from '$app/env';
import type { HandleClientError } from '@sveltejs/kit/hooks';

// During development, show the actual cause of unexpected errors on the error page.
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind !== 'unknown') return;
	console.error(error);
	if (dev) return { message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
};
