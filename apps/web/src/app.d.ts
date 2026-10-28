// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	const __APP_VERSION__: string;
	const __APP_COMMIT__: string;

	namespace App {
		interface Locals {
			user: { id: string; email: string; createdAt: Date; role: string; totpEnabledAt: Date | null } | null;
			sessionId: string | null;
			/** When this session passed the authenticator-app check (administrators). */
			sessionMfaAt: Date | null;
			/** Interface language (lib/i18n). */
			locale: import('./lib/i18n/locales.ts').Locale;
		}
		interface PageData {
			user?: {
				email: string;
				profile: { username: string; displayName: string; avatarColor: string } | null;
				avatar: string | null;
				level: import('./lib/progress/xp.ts').LevelStatus;
				best: number | null;
				pace: import('./lib/server/progress.ts').PaceSummary;
				resets: import('./lib/data/categories.ts').DataResets;
				isAdmin: boolean;
			} | null;
			siteUrl?: string;
			locale?: import('./lib/i18n/locales.ts').Locale;
			/** Whether browser analytics is switched on for this site (ANALYTICS_DISABLED). */
			analytics?: boolean;
			/** Signed token for sending analytics events (lib/server/analytics/token.ts). */
			analyticsToken?: string | null;
		}
		interface Error {
			message: string;
			/** For unexpected errors: a reference to the full details in the server log. */
			id?: string;
		}
	}
}

export {};
