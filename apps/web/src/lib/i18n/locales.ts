/*
 * Locale registry. American English is the source language; every other locale is added here and translated
 * from it. Formatting goes through `format.ts`, never a hard-coded locale tag.
 */

export const LOCALES = {
	'en-US': { name: 'English (US)', dir: 'ltr', og: 'en_US' }
} as const satisfies Record<string, { name: string; dir: 'ltr' | 'rtl'; og: string }>;

export type Locale = keyof typeof LOCALES;

export const DEFAULT_LOCALE: Locale = 'en-US';

export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && Object.hasOwn(LOCALES, value);

/** The supported locale for a tag such as `en-us`, else the default. */
export const resolveLocale = (tag: string | null | undefined): Locale => {
	if (!tag) return DEFAULT_LOCALE;
	const match = (Object.keys(LOCALES) as Locale[]).find((l) => l.toLowerCase() === tag.toLowerCase());
	return match ?? DEFAULT_LOCALE;
};
