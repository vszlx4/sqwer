// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: { id: string; email: string; createdAt: Date } | null;
			sessionId: string | null;
		}
		interface PageData {
			user?: {
				email: string;
				profile: { username: string; displayName: string; avatarColor: string } | null;
				avatar: string | null;
				level: import('./lib/progress/xp.ts').LevelStatus;
			} | null;
			siteUrl?: string;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
