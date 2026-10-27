// Refuses to install on Node versions below engines.node.
import { readFileSync } from 'node:fs';

const { engines } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const required = engines.node.replace(/^>=\s*/, '');
const toParts = (v) => v.replace(/^v/, '').split('.').map(Number);

const [have, need] = [toParts(process.versions.node), toParts(required)];
const diff = have.map((n, i) => n - need[i]).find((d) => d !== 0) ?? 0;

if (diff < 0) {
	console.error(`sqwer needs Node.js ${required} or later (security release); this is ${process.versions.node}.`);
	console.error('Update from https://nodejs.org/en/download or run `nvm install`.');
	process.exit(1);
}
