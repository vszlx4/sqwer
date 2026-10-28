import { randomBytes } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { sequence, type Handle, type HandleServerError, type ServerInit } from '@sveltejs/kit/hooks';
import { checkConfiguration } from '#lib/server/config-check.ts';
import { checkBody } from '#lib/server/body-limits.ts';
import {
	clearSessionCookie,
	deleteExpiredSessions,
	SESSION_COOKIE,
	setSessionCookie,
	validateSession
} from '#lib/server/auth.ts';
import { startAnalyticsMaintenance } from '#lib/server/analytics/maintenance.ts';
import { DEFAULT_LOCALE, LOCALES } from '#lib/i18n/locales.ts';

/** Background upkeep of analytics (daily totals and retention), once per server process. */
export const init: ServerInit = () => {
	checkConfiguration();
	startAnalyticsMaintenance();
};

/** Unexpected errors: details logged under a reference; the response shows only the reference. */
export const handleError: HandleServerError = (input) => {
	// Errors raised on purpose (error(404, …)) and SvelteKit's own keep their status and message.
	if (input.kind !== 'unknown') return;
	const id = randomBytes(6).toString('hex');
	const e = input.error as { message?: string; stack?: string } | undefined;
	console.error(
		JSON.stringify({
			at: new Date().toISOString(),
			kind: 'error',
			id,
			method: input.event.request.method,
			// The path only: query strings can carry personal data.
			path: input.event.url.pathname,
			error: String(e?.message ?? input.error).slice(0, 500),
			stack: e?.stack?.split('\n').slice(0, 8).join('\n')
		})
	);
	return { message: 'Internal Error', id };
};

/** Request bodies are limited per route (lib/server/body-limits.ts) before anything reads them. */
const bodyLimits: Handle = ({ event, resolve }) => {
	const verdict = checkBody(event.request.method, event.url, event.request.headers);
	if (verdict === 'ok') return resolve(event);
	const status = verdict === 'too-large' ? 413 : 411;
	const message = verdict === 'too-large' ? 'The request is too large.' : 'The request must state its length.';
	return event.url.pathname.startsWith('/api/') ? json({ message }, { status }) : new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
};

/** Requests that look proxied while client addresses are not read from the proxy. */
let proxyWarned = false;
const proxyCheck: Handle = ({ event, resolve }) => {
	if (!proxyWarned && !process.env.ADDRESS_HEADER && event.request.headers.has('x-forwarded-for')) {
		proxyWarned = true;
		console.warn(
			JSON.stringify({
				kind: 'config',
				warning:
					'Requests arrive through a proxy (X-Forwarded-For) but ADDRESS_HEADER is not set, so every visitor appears to come from the proxy and shares its rate limits. Set ADDRESS_HEADER and XFF_DEPTH.'
			})
		);
	}
	return resolve(event);
};

/** Expired sessions are purged at most once an hour. */
let lastPurge = 0;

const authenticate: Handle = async ({ event, resolve }) => {
	if (Date.now() - lastPurge > 60 * 60 * 1000) {
		lastPurge = Date.now();
		deleteExpiredSessions().catch(() => {});
	}
	event.locals.user = null;
	event.locals.sessionId = null;
	event.locals.sessionMfaAt = null;
	const token = event.cookies.get(SESSION_COOKIE);
	// The unprefixed cookie of earlier versions is no longer read on HTTPS sites, and is removed.
	if (SESSION_COOKIE !== 'sqwer_session' && event.cookies.get('sqwer_session')) event.cookies.delete('sqwer_session', { path: '/' });
	if (token) {
		const result = await validateSession(token);
		if (result) {
			event.locals.user = result.user;
			event.locals.sessionId = result.session.id;
			event.locals.sessionMfaAt = result.session.mfaVerifiedAt;
			if (result.renewed) setSessionCookie(event.cookies, token, result.session.expiresAt, event.url.protocol === 'https:');
		} else {
			clearSessionCookie(event.cookies);
		}
	}
	return resolve(event);
};

/** Interface language for the request; only the default until more locales ship. */
const locale: Handle = async ({ event, resolve }) => {
	event.locals.locale = DEFAULT_LOCALE;
	const { dir } = LOCALES[event.locals.locale];
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%sqwer.lang%', event.locals.locale).replace('%sqwer.dir%', dir)
	});
};

/** Mutating API requests: same-origin JSON only, no CORS. Forms use SvelteKit's origin check. */
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
	// COOP/CORP isolation. Turnstile's frame is unaffected.
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	// Signed-in pages are personal and must not be cached by shared caches.
	if (event.locals.user && !response.headers.has('Cache-Control')) {
		response.headers.set('Cache-Control', 'private, no-store');
	}
	return response;
};

export const handle = sequence(securityHeaders, bodyLimits, proxyCheck, apiGuard, locale, authenticate);
