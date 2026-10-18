/**
 * In-memory sliding-window rate limiter for a single server process; use a shared store, such as
 * Redis, if the app is scaled out to several processes.
 *
 * The number of keys is bounded. When the bound is reached, keys with no recent activity are
 * dropped first, then keys with a single attempt (what a flood of new keys consists of), and only
 * then the least recently used; the table is never cleared wholesale. Flooding it with new keys
 * therefore cannot wipe the record of an address or account that has been building up attempts.
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 100_000;
/** No limit in this app uses a window longer than this. */
const LONGEST_WINDOW_MS = 24 * 60 * 60 * 1000;

function touch(key: string, list: number[]) {
	// Re-inserting keeps the map ordered from least to most recently used.
	hits.delete(key);
	hits.set(key, list);
	if (hits.size <= MAX_KEYS) return;
	const now = Date.now();
	for (const [k, v] of hits) {
		if (hits.size <= MAX_KEYS * 0.9) break;
		if (!v.length || now - v[v.length - 1]! > LONGEST_WINDOW_MS) hits.delete(k);
	}
	for (const [k, v] of hits) {
		if (hits.size <= MAX_KEYS * 0.9) break;
		if (v.length <= 1) hits.delete(k);
	}
	for (const k of hits.keys()) {
		if (hits.size <= MAX_KEYS * 0.9) break;
		hits.delete(k);
	}
}

const recentOf = (key: string, windowMs: number, now: number) => (hits.get(key) ?? []).filter((t) => now - t < windowMs);
const retryOf = (recent: number[], windowMs: number, now: number) => Math.ceil((windowMs - (now - recent[0]!)) / 1000);

/** Records an attempt and reports whether it is within the limit. */
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const recent = recentOf(key, windowMs, now);
	if (recent.length >= max) {
		touch(key, recent);
		return { ok: false, retryAfter: retryOf(recent, windowMs, now) };
	}
	recent.push(now);
	touch(key, recent);
	return { ok: true, retryAfter: 0 };
}

/** Attempts recorded for a key within the window, without recording a new one. */
export function countRecent(key: string, windowMs: number): number {
	return recentOf(key, windowMs, Date.now()).length;
}

/**
 * A weighted allowance: `amount` is taken from `max` per window if it fits. Used where requests
 * differ in size, such as typing time that earns XP.
 */
const budgets = new Map<string, { at: number; amount: number }[]>();
export function spendBudget(key: string, amount: number, max: number, windowMs: number): boolean {
	const now = Date.now();
	const recent = (budgets.get(key) ?? []).filter((e) => now - e.at < windowMs);
	const used = recent.reduce((n, e) => n + e.amount, 0);
	if (used + amount > max) {
		budgets.set(key, recent);
		return false;
	}
	recent.push({ at: now, amount });
	budgets.delete(key);
	budgets.set(key, recent);
	// Bounded like the other limits: the least recently used keys go first.
	if (budgets.size > MAX_KEYS) for (const k of budgets.keys()) if (budgets.size > MAX_KEYS * 0.9) budgets.delete(k); else break;
	return true;
}

export function rateLimitMessage(retryAfter: number) {
	const minutes = Math.max(1, Math.ceil(retryAfter / 60));
	return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

/** Checks a limit without recording an attempt; pair with `recordFailure`. */
export function failureLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const recent = recentOf(key, windowMs, now);
	if (recent.length >= max) return { ok: false, retryAfter: retryOf(recent, windowMs, now) };
	return { ok: true, retryAfter: 0 };
}

export function recordFailure(key: string) {
	const now = Date.now();
	const list = recentOf(key, LONGEST_WINDOW_MS, now);
	list.push(now);
	touch(key, list);
}

/** For tests: forgets every recorded attempt. */
export function resetRateLimits() {
	hits.clear();
	budgets.clear();
}
