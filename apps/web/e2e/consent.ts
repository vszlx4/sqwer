/**
 * Browser storage in which the analytics question has already been answered with "No, thanks",
 * so the consent banner does not cover the page in tests about other things. The analytics tests
 * start from an empty context instead.
 */
export const ORIGIN = 'http://localhost:4321';
export const DECLINED = {
	cookies: [],
	origins: [{ origin: ORIGIN, localStorage: [{ name: 'sqwer:analytics-consent', value: JSON.stringify({ v: 1, choice: 'denied', at: '2026-01-01T00:00:00.000Z' }) }] }]
};
