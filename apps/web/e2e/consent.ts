/** Storage with analytics consent already refused, so the banner stays out of non-analytics tests. */
export const ORIGIN = 'http://localhost:4321';
export const DECLINED = {
	cookies: [],
	origins: [{ origin: ORIGIN, localStorage: [{ name: 'sqwer:analytics-consent', value: JSON.stringify({ v: 1, choice: 'denied', at: '2026-01-01T00:00:00.000Z' }) }] }]
};
