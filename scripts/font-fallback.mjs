// Fills missing PP fonts with Roboto Flex. SQWER_BRAND_FONTS=required fails instead.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fallback = join(root, 'scripts/fonts/RobotoFlex-Variable.woff2');

const sources = [['apps/web/src/app.css', /url\('([^']*PP[^']*\.woff2)'\)/g]];

const missing = [];
for (const [file, pattern] of sources) {
	const source = join(root, file);
	if (!existsSync(source)) continue;
	for (const [, path] of readFileSync(source, 'utf8').matchAll(pattern)) {
		const font = resolve(dirname(source), path);
		if (!existsSync(font)) missing.push(font);
	}
}

if (missing.length > 0) {
	if (process.env.SQWER_BRAND_FONTS === 'required') {
		console.error(`font-fallback: missing ${missing.length} fonts:\n  ${missing.join('\n  ')}`);
		process.exit(1);
	}
	for (const font of missing) {
		mkdirSync(dirname(font), { recursive: true });
		copyFileSync(fallback, font);
	}
	console.warn(`font-fallback: using Roboto Flex for ${missing.length} missing fonts`);
}
