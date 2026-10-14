/**
 * Simple in-memory sliding-window rate limiter. Suitable for a single server
 * process; use a shared store if the app is scaled out.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	if (recent.length >= max) {
		hits.set(key, recent);
		return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0]!)) / 1000) };
	}
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 50_000) hits.clear();
	return { ok: true, retryAfter: 0 };
}

export function rateLimitMessage(retryAfter: number) {
	const minutes = Math.max(1, Math.ceil(retryAfter / 60));
	return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}

/** Checks a limit without recording an attempt; pair with `recordFailure`. */
export function failureLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	hits.set(key, recent);
	if (recent.length >= max) return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0]!)) / 1000) };
	return { ok: true, retryAfter: 0 };
}

export function recordFailure(key: string) {
	const list = hits.get(key) ?? [];
	list.push(Date.now());
	hits.set(key, list);
}
