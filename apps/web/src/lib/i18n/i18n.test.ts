import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, formatDate, formatDateTime, formatDay, formatNumber, isLocale, LOCALES, resolveLocale } from './index.ts';

describe('i18n', () => {
	it('defaults to American English', () => {
		expect(DEFAULT_LOCALE).toBe('en-US');
		expect(LOCALES[DEFAULT_LOCALE].dir).toBe('ltr');
	});

	it('resolves known tags case-insensitively and falls back to the default', () => {
		expect(resolveLocale('EN-us')).toBe('en-US');
		expect(resolveLocale('en-GB')).toBe('en-US');
		expect(resolveLocale(null)).toBe('en-US');
		expect(isLocale('en-US')).toBe(true);
		expect(isLocale('en-GB')).toBe(false);
	});

	it('formats in US order', () => {
		expect(formatNumber(1234567)).toBe('1,234,567');
		expect(formatDate('2026-10-28T00:00:00Z', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })).toBe('Oct 28, 2026');
		expect(formatDay('2026-10-28')).toBe('October 28, 2026');
		expect(formatDateTime(Date.UTC(2026, 9, 28, 14, 5), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })).toMatch(/^Oct 28, 2026, 2:05\sPM$/);
	});
});
