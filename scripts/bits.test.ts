import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { addEntry, BITS_DIR, blocked, entry, header, licenceText, listed, NOTICES, packages, readHeader } from './bits.mjs';

const root = join(import.meta.dirname, '..');
const SHA = 'c37078c5ff7af7b090e510e0a2d0fbb472c1d286';
const LIST = 'Svelte Bits\n\nComponents (source path, upstream commit):\n\n- None yet.\n\nMIT + Commons Clause License Condition v1.0\n\nText';

describe('bits intake', () => {
	it('reads package names from registry specs', () => {
		expect(packages(['gsap', 'gsap@^3.15.0', '@scope/pkg@1.2.0', 'motion'])).toEqual(['@scope/pkg', 'gsap', 'motion']);
		expect(blocked(['gsap', 'gsap@^3.15.0'])).toEqual([]);
		expect(blocked(['motion@^12', 'ogl'], ['ogl'])).toEqual(['motion']);
	});

	it('writes a header it can read back', () => {
		const source = header({ title: 'Split Text', name: 'split-text', sha: SHA }) + '<script lang="ts"></script>\n';
		expect(readHeader(source)).toEqual({
			title: 'Split Text',
			source: `https://github.com/DavidHDev/svelte-bits/blob/${SHA}/static/r/split-text.json`,
			sha: SHA
		});
		expect(readHeader('<script lang="ts"></script>')).toBeNull();
	});

	it('keeps the notices list sorted, replacing None yet and old entries', () => {
		const a = entry({ file: 'SplitText.svelte', name: 'split-text', sha: SHA });
		const b = entry({ file: 'Magnet.svelte', name: 'magnet', sha: SHA });
		let text = addEntry(addEntry(LIST, a), b);
		expect(listed(text)).toEqual(['Magnet.svelte', 'SplitText.svelte']);
		expect(text).not.toContain('None yet');
		text = addEntry(text, entry({ file: 'Magnet.svelte', name: 'magnet', sha: 'f'.repeat(40) }));
		expect(listed(text)).toEqual(['Magnet.svelte', 'SplitText.svelte']);
		expect(text).toContain('@ ffffffffffff');
		expect(licenceText(text)).toBe('MIT + Commons Clause License Condition v1.0\n\nText');
	});
});

describe('lib/bits', () => {
	const notices = readFileSync(join(root, NOTICES), 'utf8');
	const dir = join(root, BITS_DIR);
	const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.svelte')) : [];

	it('has a licence header on every component', () => {
		for (const file of files) expect(readHeader(readFileSync(join(dir, file), 'utf8')), file).not.toBeNull();
	});

	it('lists exactly the copied components in THIRD_PARTY_NOTICES', () => {
		expect(listed(notices).sort()).toEqual(files.sort());
		expect(licenceText(notices)).toContain('Commons Clause Restriction');
	});
});
