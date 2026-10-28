import { DEFAULT_LOCALE, type Locale } from './locales.ts';

type DateInput = Date | number | string;

const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

/** Grouped number, e.g. 12,345. */
export const formatNumber = (n: number, options?: Intl.NumberFormatOptions, locale: Locale = DEFAULT_LOCALE) => n.toLocaleString(locale, options);

/** Date only. */
export const formatDate = (d: DateInput, options?: Intl.DateTimeFormatOptions, locale: Locale = DEFAULT_LOCALE) =>
	toDate(d).toLocaleDateString(locale, options);

/** A calendar day given as ISO 8601 (`2026-10-28`), in long form, e.g. October 28, 2026. */
export const formatDay = (iso: string, locale: Locale = DEFAULT_LOCALE) => formatDate(`${iso}T00:00:00Z`, { dateStyle: 'long', timeZone: 'UTC' }, locale);

/** Date and time. */
export const formatDateTime = (d: DateInput, options?: Intl.DateTimeFormatOptions, locale: Locale = DEFAULT_LOCALE) =>
	toDate(d).toLocaleString(locale, options);
