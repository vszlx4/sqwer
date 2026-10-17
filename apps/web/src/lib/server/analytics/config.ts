/*
 * Analytics settings, all optional:
 *
 * - ANALYTICS_DISABLED=1 stops collecting browser events (the endpoint answers 204) and hides the
 *   consent banner. Server events keep being recorded.
 * - ANALYTICS_RETENTION_DAYS sets how long raw events are kept (default 395, about 13 months).
 *   Daily totals are kept after that.
 */
export const analyticsEnabled = () => !['1', 'true', 'yes'].includes((process.env.ANALYTICS_DISABLED ?? '').toLowerCase());

export function retentionDays(): number {
	const n = Number(process.env.ANALYTICS_RETENTION_DAYS);
	return Number.isFinite(n) && n >= 30 ? Math.floor(n) : 395;
}
