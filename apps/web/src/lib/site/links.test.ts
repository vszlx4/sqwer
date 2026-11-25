import { describe, expect, it } from 'vitest';
import { accountSection } from './links.ts';

describe('accountSection', () => {
	it('finds the sidebar entry for every account page', () => {
		expect(accountSection('/account')?.label).toBe('Overview');
		expect(accountSection('/account/history/abc')?.label).toBe('History');
		expect(accountSection('/account/admin/users')?.label).toBe('Administration');
		expect(accountSection('/account/privacy')?.label).toBe('Privacy');
		expect(accountSection('/account/setup')).toBeUndefined();
		expect(accountSection('/accountant')).toBeUndefined();
	});
});
