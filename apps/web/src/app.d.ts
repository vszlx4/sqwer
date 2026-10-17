// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: { id: string; email: string; createdAt: Date; role: string } | null;
			sessionId: string | null;
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
			/** Whether browser analytics is switched on for this site (ANALYTICS_DISABLED). */
			analytics?: boolean;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
