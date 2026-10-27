import { consent, SESSION_KEY, VISITOR_KEY } from './consent.svelte.ts';

/*
 * Browser tracker, after consent only. Page views (referrer and UTM on landing) and visible time, batched
 * via keepalive/sendBeacon; failed sends are dropped. Only utm_* query params are sent.
 */

const SESSION_IDLE_MS = 30 * 60 * 1000;
const ENDPOINT = '/api/analytics';

/** The token issued with the page (lib/server/analytics/token.ts); nothing is sent without one. */
let token: string | null = null;
export function setAnalyticsToken(value: string | null | undefined) {
	token = value ?? null;
}

interface Pending {
	id: string;
	type: 'pageview' | 'engagement';
	at: number;
	path: string;
	route: string | null;
	referrer?: string;
	utm?: { source?: string; medium?: string; campaign?: string };
	visitor: string;
	session: string;
	duration?: number;
}

const uuid = () => crypto.randomUUID();

function visitorId(): string | null {
	try {
		let id = localStorage.getItem(VISITOR_KEY);
		if (!id) {
			id = uuid();
			localStorage.setItem(VISITOR_KEY, id);
		}
		return id;
	} catch {
		return null;
	}
}

/** The current visit: a new one starts after 30 minutes without activity. */
function sessionId(): { id: string; fresh: boolean } | null {
	try {
		const now = Date.now();
		const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as { id: string; last: number } | null;
		const fresh = !saved || now - saved.last > SESSION_IDLE_MS;
		const id = fresh ? uuid() : saved!.id;
		sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
		return { id, fresh };
	} catch {
		return null;
	}
}

let queue: Pending[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function send(events: Pending[], beacon = false) {
	if (!events.length || !token) return;
	const body = JSON.stringify({ token, events });
	if (beacon && navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
	void fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

function enqueue(e: Pending) {
	queue.push(e);
	if (queue.length >= 20) return flush();
	clearTimeout(flushTimer);
	flushTimer = setTimeout(flush, 2000);
}

export function flush(beacon = false) {
	clearTimeout(flushTimer);
	const batch = queue;
	queue = [];
	for (let i = 0; i < batch.length; i += 20) send(batch.slice(i, i + 20), beacon);
}

/* --------------------------------------------------------------- pages */

let current: { path: string; route: string | null; visibleSince: number | null; visibleMs: number } | null = null;

function onVisibility() {
	if (!current) return;
	if (document.visibilityState === 'hidden') {
		if (current.visibleSince !== null) current.visibleMs += performance.now() - current.visibleSince;
		current.visibleSince = null;
		endPage(true);
	} else if (current.visibleSince === null) {
		current.visibleSince = performance.now();
	}
}

/** Records how long the current page was visible, then forgets it. */
function endPage(beacon = false) {
	if (!current) return;
	const ms = Math.round(current.visibleMs + (current.visibleSince !== null ? performance.now() - current.visibleSince : 0));
	const visitor = visitorId();
	const session = sessionId();
	if (consent.granted && visitor && session && ms >= 500) {
		enqueue({ id: uuid(), type: 'engagement', at: Date.now(), path: current.path, route: current.route, visitor, session: session.id, duration: Math.min(ms, 6 * 60 * 60 * 1000) });
	}
	current.visibleMs = 0;
	current.visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
	flush(beacon);
}

/** A page was opened (first load or navigation). */
export function trackPage(url: { pathname: string; searchParams: { get(name: string): string | null } }, route: string | null) {
	if (!consent.granted || url.pathname.startsWith('/admin')) return;
	if (current) {
		endPage();
		current = null;
	}
	const visitor = visitorId();
	const session = sessionId();
	if (!visitor || !session) return;
	const params = url.searchParams;
	const utm = { source: params.get('utm_source') ?? undefined, medium: params.get('utm_medium') ?? undefined, campaign: params.get('utm_campaign') ?? undefined };
	const first = session.fresh;
	enqueue({
		id: uuid(),
		type: 'pageview',
		at: Date.now(),
		path: url.pathname.slice(0, 300),
		route,
		referrer: first && document.referrer ? document.referrer.slice(0, 500) : undefined,
		utm: first && (utm.source || utm.medium || utm.campaign) ? utm : undefined,
		visitor,
		session: session.id
	});
	current = { path: url.pathname.slice(0, 300), route, visibleSince: document.visibilityState === 'visible' ? performance.now() : null, visibleMs: 0 };
}

let started = false;
export function startTracking() {
	if (started) return;
	started = true;
	document.addEventListener('visibilitychange', onVisibility);
	addEventListener('pagehide', () => endPage(true));
}
