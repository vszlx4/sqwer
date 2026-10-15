import { z } from 'zod';
import { AVATAR_COLORS, BANNERS, EXPERIENCE, GOALS, PASSWORD_RULE, PLATFORMS, USERNAME_RULE } from '../profile.ts';

const values = <T extends readonly { value: string }[]>(list: T) =>
	list.map((o) => o.value) as unknown as [T[number]['value'], ...T[number]['value'][]];

export const RESERVED_USERNAMES = new Set([
	'admin', 'administrator', 'root', 'support', 'help', 'sqwer', 'account', 'settings', 'signin', 'signup',
	'login', 'logout', 'api', 'about', 'privacy', 'terms', 'cookies', 'faq', 'test', 'map', 'u', 'system', 'null'
]);

/** Removes control, zero-width and text-direction characters that can disguise text. */
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
export const cleanText = (value: string) => value.replace(UNSAFE_CHARS, '').normalize('NFC');

export const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.max(254, 'Enter an email address of 254 characters or fewer.')
	.pipe(z.email('Enter a valid email address.'));

export const passwordSchema = z
	.string()
	.min(10, PASSWORD_RULE)
	.max(128, 'Use 128 characters or fewer.');

export const usernameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9_]{3,24}$/, USERNAME_RULE)
	.refine((u) => !RESERVED_USERNAMES.has(u), 'This username is reserved. Please choose another.');

export const profileSchema = z.object({
	displayName: z
		.string()
		.transform(cleanText)
		.pipe(z.string().trim().min(1, 'Enter a display name.').max(40, 'Use 40 characters or fewer.')),
	username: usernameSchema,
	bio: z
		.string()
		.transform((v) => cleanText(v).replace(/\n{3,}/g, '\n\n'))
		.pipe(z.string().trim().max(280, 'Use 280 characters or fewer.'))
		.default(''),
	experience: z.enum(values(EXPERIENCE), { message: 'Select your typing experience.' }),
	goal: z.enum(values(GOALS), { message: 'Select your main goal.' }),
	targetWpm: z.coerce
		.number({ message: 'Enter a target speed.' })
		.int('Enter a whole number.')
		.min(10, 'Enter a target of at least 10 WPM.')
		.max(250, 'Enter a target of 250 WPM or less.'),
	platform: z.enum(values(PLATFORMS), { message: 'Select your keyboard type.' }),
	avatarColor: z.enum(values(AVATAR_COLORS), { message: 'Select an avatar colour.' }),
	isPublic: z.boolean(),
	headline: z
		.string()
		.transform(cleanText)
		.pipe(z.string().trim().max(80, 'Use 80 characters or fewer.'))
		.default(''),
	pronouns: z
		.string()
		.transform(cleanText)
		.pipe(z.string().trim().max(24, 'Use 24 characters or fewer.'))
		.default(''),
	banner: z.enum(values(BANNERS), { message: 'Select a banner.' }),
	showRank: z.boolean(),
	showStats: z.boolean(),
	showStreak: z.boolean()
});

export type ProfileInput = z.infer<typeof profileSchema>;

/** Field name → first error message. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? 'form');
		out[key] ??= issue.message;
	}
	return out;
}

export function readProfileForm(form: FormData) {
	return profileSchema.safeParse({
		displayName: form.get('displayName') ?? '',
		username: form.get('username') ?? '',
		bio: form.get('bio') ?? '',
		experience: form.get('experience') ?? '',
		goal: form.get('goal') ?? '',
		targetWpm: form.get('targetWpm') ?? '',
		platform: form.get('platform') ?? '',
		avatarColor: form.get('avatarColor') ?? '',
		isPublic: form.get('isPublic') === 'on',
		headline: form.get('headline') ?? '',
		pronouns: form.get('pronouns') ?? '',
		banner: form.get('banner') ?? 'lime',
		showRank: form.get('showRank') === 'on',
		showStats: form.get('showStats') === 'on',
		showStreak: form.get('showStreak') === 'on'
	});
}

/** Only allow same-site relative redirects. */
export function safeRedirect(target: string | null, fallback: string): string {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
	return target;
}
