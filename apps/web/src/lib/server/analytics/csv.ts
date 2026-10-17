/**
 * One CSV cell (RFC 4180). Values a spreadsheet could read as a formula are prefixed with an
 * apostrophe, so an exported page path or referrer can never run as one.
 */
export function csvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	let s = String(value);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
