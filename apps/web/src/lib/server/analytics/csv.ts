/** RFC 4180 CSV cell. Formula-like values get a leading apostrophe. */
export function csvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	let s = String(value);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
