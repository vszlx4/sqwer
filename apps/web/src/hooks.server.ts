import { json } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import {
	clearSessionCookie,
	deleteExpiredSessions,
	SESSION_COOKIE,
	setSessionCookie,
	validateSession
} from '#lib/server/auth.ts';

/** Expired sessions are purged at most once an hour. */
let lastPurge = 0;

const authenticate: Handle = async ({ event, resolve }) => {
	if (Date.now() - lastPurge > 60 * 60 * 1000) {
		lastPurge = Date.now();
		deleteExpiredSessions().catch(() => {});
	}
	event.locals.user = null;
	event.locals.sessionId = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const result = await validateSession(token);
		if (result) {
			event.locals.user = result.user;
			event.locals.sessionId = result.session.id;
			if (result.renewed) setSessionCookie(event.cookies, token, result.session.expiresAt, event.url.protocol === 'https:');
		} else {
			clearSessionCookie(event.cookies);
		}
	}
	return resolve(event);
};

/**
 * API requests that change data must come from this site (no cross-origin use,
 * no CORS headers are ever sent) and must be JSON. Form posts are covered by
 * SvelteKit's built-in origin check.
 */
const apiGuard: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith('/api/')) return resolve(event);
	const method = event.request.method;
	if (method === 'OPTIONS') return new Response(null, { status: 405 });
	if (method !== 'GET' && method !== 'HEAD') {
		if (event.request.headers.get('origin') !== event.url.origin) {
			return json({ message: 'Cross-site requests are not allowed.' }, { status: 403 });
		}
		if (!event.request.headers.get('content-type')?.startsWith('application/json')) {
			return json({ message: 'Requests must be sent as JSON.' }, { status: 415 });
		}
	}
	return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	// Signed-in pages are personal and must not be cached by shared caches.
	if (event.locals.user && !response.headers.has('Cache-Control')) {
		response.headers.set('Cache-Control', 'private, no-store');
	}
	return response;
};

export const handle = sequence(securityHeaders, apiGuard, authenticate);
