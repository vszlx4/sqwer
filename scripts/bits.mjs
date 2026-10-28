// npm run bits -- list [--gsap]                                list upstream components and their dependencies
// npm run bits -- add <name> [--ref <sha>] [--allow <deps>]    copy a component into apps/web/src/lib/bits/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const REPO = 'DavidHDev/svelte-bits';
export const BITS_DIR = 'apps/web/src/lib/bits';
export const NOTICES = 'THIRD_PARTY_NOTICES';
// Already dependencies of apps/web. Anything else needs --allow and a licence check; motion ports to lib/motion.
export const ALLOWED = ['gsap'];
const NONE = '- None yet.';

const fail = (msg) => {
	console.error(`bits: ${msg}`);
	process.exit(1);
};

/** Package names from registry specs ("gsap", "gsap@^3.15.0", "@scope/pkg@1"). */
export function packages(specs = []) {
	return [...new Set(specs.map((s) => s.replace(/(?<=.)@[^@/]*$/, '')))].sort();
}

/** Dependencies outside ALLOWED and the --allow list. */
export function blocked(specs, allow = []) {
	return packages(specs).filter((p) => !ALLOWED.includes(p) && !allow.includes(p));
}

/** Licence and provenance header placed at the top of every copied component. */
export function header({ title, name, sha }) {
	return [
		'<!--',
		`	Svelte Bits: ${title}`,
		`	Source: https://github.com/${REPO}/blob/${sha}/static/r/${name}.json`,
		`	Upstream commit: ${sha}`,
		'	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.',
		'	Changes: none',
		'-->',
		''
	].join('\n');
}

/** Parses the header of a copied component; null when it is missing or incomplete. */
export function readHeader(source) {
	const m = /^<!--\n\tSvelte Bits: (.+)\n\tSource: (\S+)\n\tUpstream commit: ([0-9a-f]{40})\n\tLicence: MIT \+ Commons Clause/.exec(source);
	return m ? { title: m[1], source: m[2], sha: m[3] } : null;
}

/** Component entry line in THIRD_PARTY_NOTICES. */
export function entry({ file, name, sha }) {
	return `- ${file}: static/r/${name}.json @ ${sha.slice(0, 12)}`;
}

/** File names listed under Svelte Bits in THIRD_PARTY_NOTICES. */
export function listed(notices) {
	return [...notices.matchAll(/^- (\S+\.svelte): static\/r\//gm)].map((m) => m[1]);
}

/** Adds or replaces a component entry, keeping the list sorted. */
export function addEntry(notices, line) {
	const file = line.slice(2, line.indexOf(':'));
	const lines = notices.split('\n');
	const start = lines.findIndex((l) => l.startsWith('Components (source path, upstream commit):'));
	if (start < 0) throw new Error('component list not found in THIRD_PARTY_NOTICES');
	let end = start + 2;
	while (lines[end]?.startsWith('- ')) end++;
	const items = lines
		.slice(start + 2, end)
		.filter((l) => l !== NONE && !l.startsWith(`- ${file}:`))
		.concat(line)
		.sort();
	lines.splice(start + 2, end - start - 2, ...items);
	return lines.join('\n');
}

/** Licence text kept in THIRD_PARTY_NOTICES, for comparison with upstream LICENSE.md. */
export function licenceText(notices) {
	const i = notices.indexOf('MIT + Commons Clause License Condition');
	if (i < 0) throw new Error('Svelte Bits licence not found in THIRD_PARTY_NOTICES');
	const end = notices.indexOf('\n====', i);
	return notices.slice(i, end < 0 ? undefined : end).trim();
}

async function get(url, as = 'text') {
	const res = await fetch(url, { headers: { 'user-agent': 'sqwer-bits' } });
	if (!res.ok) fail(`${res.status} ${url}`);
	return res[as]();
}

const raw = (sha, path) => get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`);

async function resolve(ref) {
	if (ref && /^[0-9a-f]{40}$/.test(ref)) return ref;
	const commit = await get(`https://api.github.com/repos/${REPO}/commits/${ref ?? 'main'}`, 'json');
	return commit.sha;
}

async function list(gsapOnly) {
	const sha = await resolve();
	const { items } = JSON.parse(await raw(sha, 'static/r/registry.json'));
	for (const item of items) {
		const deps = packages(item.dependencies);
		if (gsapOnly && blocked(item.dependencies).length) continue;
		console.log(`${item.name.padEnd(24)} ${deps.join(', ') || '-'}`);
	}
	console.log(`\n${REPO} @ ${sha.slice(0, 12)}`);
}

async function add(name, ref, allow) {
	if (!name || !/^[a-z0-9-]+$/.test(name)) fail('usage: npm run bits -- add <name> [--ref <sha>] [--allow <deps>]');
	const sha = await resolve(ref);
	const noticesPath = join(root, NOTICES);
	const notices = readFileSync(noticesPath, 'utf8');

	// Licences have changed upstream before; stop if this commit's differs from the one we ship.
	if ((await raw(sha, 'LICENSE.md')).trim() !== licenceText(notices))
		fail(`LICENSE.md at ${sha.slice(0, 12)} differs from ${NOTICES}; review it before copying`);

	const item = JSON.parse(await raw(sha, `static/r/${name}.json`));
	if (item.registryDependencies?.length) fail(`${name} needs ${item.registryDependencies.join(', ')}; add those first`);
	const extra = blocked(item.dependencies, allow);
	if (extra.length)
		fail(`${name} needs ${extra.join(', ')}. Port motion to lib/motion, or pass --allow ${extra.join(',')} after a licence check`);
	if (item.files.length !== 1) fail(`${name} has ${item.files.length} files; copy it by hand`);

	const [{ path: file, content }] = item.files;
	const dir = join(root, BITS_DIR);
	const target = join(dir, file);
	const update = existsSync(target);
	mkdirSync(dir, { recursive: true });
	writeFileSync(target, header({ title: item.title, name, sha }) + content.replace(/^\s+/, ''));
	writeFileSync(noticesPath, addEntry(notices, entry({ file, name, sha })));

	const missing = packages(item.dependencies).filter((p) => !ALLOWED.includes(p));
	console.log(`${update ? 'updated' : 'added'} ${BITS_DIR}/${file} (${REPO} @ ${sha.slice(0, 12)})`);
	if (missing.length) console.log(`install: npm install -w web ${missing.join(' ')}`);
	console.log(`import: import ${file.replace('.svelte', '')} from '#lib/bits/${file}';`);
	console.log('next: intake checklist in docs/design/SYSTEM.md 5 (tokens, lib/motion eases, reduced motion, a11y, SSR); log edits under Changes');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [cmd, ...rest] = process.argv.slice(2);
	const flag = (f) => {
		const i = rest.indexOf(f);
		return i >= 0 ? rest[i + 1] : undefined;
	};
	if (cmd === 'list') await list(rest.includes('--gsap'));
	else if (cmd === 'add') await add(rest[0], flag('--ref'), flag('--allow')?.split(',') ?? []);
	else fail('usage: npm run bits -- list [--gsap] | add <name> [--ref <sha>] [--allow <deps>]');
}
