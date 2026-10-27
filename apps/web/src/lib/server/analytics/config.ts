/*
 * ANALYTICS_DISABLED=1: no browser events (endpoint 204), no banner; server events continue.
 * ANALYTICS_RETENTION_DAYS: raw event retention (default 395). Daily totals are kept.
 */
export const analyticsEnabled = () => !['1', 'true', 'yes'].includes((process.env.ANALYTICS_DISABLED ?? '').toLowerCase());

export function retentionDays(): number {
	const n = Number(process.env.ANALYTICS_RETENTION_DAYS);
	return Number.isFinite(n) && n >= 30 ? Math.floor(n) : 395;
}
