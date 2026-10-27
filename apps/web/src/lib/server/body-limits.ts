/*
 * Per-route body limits. BODY_SIZE_LIMIT (6 MB, scripts/start.js) is the ceiling; other routes are checked
 * before reading.
 */

const KB = 1024;
const MB = 1024 * KB;

/** Forms (sign-in, sign-up, settings) and small API calls. */
export const DEFAULT_BODY_LIMIT = 64 * KB;

const ROUTES: { method: string; path: string; action?: string; limit: number }[] = [
	// The full finger map is replaced on every sync.
	{ method: 'PUT', path: '/api/fingermap', limit: 6 * MB },
	// A result with its keystroke replay; usage statistics of one device.
	{ method: 'POST', path: '/api/results', limit: 1 * MB },
	{ method: 'PUT', path: '/api/usage', limit: 1 * MB },
	// A profile picture of up to 1 MB, as multipart form data.
	{ method: 'POST', path: '/account/profile', action: '/avatar', limit: 1.5 * MB },
	{ method: 'POST', path: '/api/analytics', limit: 32 * KB }
];

/** The most a request to this route may send. */
export function bodyLimit(method: string, url: URL): number {
	const route = ROUTES.find((r) => r.method === method && r.path === url.pathname && (!r.action || url.searchParams.has(r.action)));
	return route?.limit ?? DEFAULT_BODY_LIMIT;
}

/** Declared body vs route limit: 'ok', 'too-large', or 'length-required' (chunked). */
export function checkBody(method: string, url: URL, headers: Headers): 'ok' | 'too-large' | 'length-required' {
	if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return 'ok';
	const length = headers.get('content-length');
	if (length === null) return headers.has('transfer-encoding') ? 'length-required' : 'ok';
	const n = Number(length);
	if (!Number.isFinite(n) || n < 0) return 'length-required';
	return n > bodyLimit(method, url) ? 'too-large' : 'ok';
}
