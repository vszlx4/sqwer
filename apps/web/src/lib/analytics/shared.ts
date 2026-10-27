/* Shared by tracker, server and dashboard. */

/** Events the browser may send, and only after the visitor has agreed to analytics. */
export const CLIENT_EVENTS = ['pageview', 'engagement'] as const;
export type ClientEventName = (typeof CLIENT_EVENTS)[number];

/** Events recorded by the server itself, where the browser could not be trusted to report them. */
export const SERVER_EVENTS = {
	signup_completed: 'Registration',
	signin_succeeded: 'Sign-in',
	signin_failed: 'Failed sign-in',
	password_reset: 'Password reset',
	profile_completed: 'Profile set up',
	test_completed: 'Test completed',
	ranked_verified: 'Ranked result verified',
	lesson_completed: 'Lesson completed',
	placement_applied: 'Placement applied',
	data_cleared: 'Data cleared',
	account_deleted: 'Account deleted'
} as const;
export type ServerEventName = keyof typeof SERVER_EVENTS;

export const EVENT_LABELS: Record<string, string> = { pageview: 'Page view', engagement: 'Time on page', ...SERVER_EVENTS };

export const CHANNELS = ['direct', 'search', 'social', 'referral', 'campaign'] as const;
export type Channel = (typeof CHANNELS)[number];
export const CHANNEL_LABELS: Record<Channel, string> = {
	direct: 'Direct',
	search: 'Search',
	social: 'Social',
	referral: 'Referral',
	campaign: 'Campaign'
};

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia|qwant|startpage|naver|seznam)\.[a-z.]+$|^search\.brave\.com$|^search\.yahoo\.com$/;
const SOCIAL =
	/(^|\.)(facebook|fb|instagram|twitter|x|t|linkedin|lnkd|reddit|youtube|youtu|tiktok|pinterest|whatsapp|telegram|discord|threads|mastodon|bsky|snapchat|quora|news\.ycombinator)\.[a-z.]+$|^t\.co$|^lnkd\.in$|^youtu\.be$/;

/** Visit channel: campaign (UTM), search, social, referral or direct. */
export function channelOf(referrerHost: string | null, utm: { source?: string | null; medium?: string | null }): Channel {
	if (utm.source || utm.medium) return 'campaign';
	if (!referrerHost) return 'direct';
	if (SEARCH.test(referrerHost)) return 'search';
	if (SOCIAL.test(referrerHost)) return 'social';
	return 'referral';
}
