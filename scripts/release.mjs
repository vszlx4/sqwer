// npm run release -- <alpha|beta|rc|stable|patch|minor|major> [patch|minor|major]   open a version bump PR
// npm run release -- publish [--notes <file>]                                     tag main and create the GitHub Release
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const MANIFESTS = ['package.json', 'apps/web/package.json'];
const STAGES = ['alpha', 'beta', 'rc'];

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', ...opts }).trim();
const fail = (msg) => {
	console.error(`release: ${msg}`);
	process.exit(1);
};

export function parse(version) {
	const m = /^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$/.exec(version);
	if (!m) throw new Error(`unsupported version ${version}`);
	return { major: +m[1], minor: +m[2], patch: +m[3], stage: m[4] ?? null, n: m[5] ? +m[5] : 0 };
}

export function format({ major, minor, patch, stage, n }) {
	return `${major}.${minor}.${patch}${stage ? `-${stage}.${n}` : ''}`;
}

function bumpBase(v, part) {
	if (part === 'major') return { ...v, major: v.major + 1, minor: 0, patch: 0 };
	if (part === 'minor') return { ...v, minor: v.minor + 1, patch: 0 };
	return { ...v, patch: v.patch + 1 };
}

/** Next version for a step. Pre-release steps continue the current stage or start a later one. */
export function next(current, step, part = 'patch') {
	const v = parse(current);
	if (STAGES.includes(step)) {
		if (v.stage === step) return format({ ...v, n: v.n + 1 });
		if (v.stage && STAGES.indexOf(step) > STAGES.indexOf(v.stage)) return format({ ...v, stage: step, n: 1 });
		if (v.stage) throw new Error(`cannot go from ${v.stage} back to ${step}`);
		return format({ ...bumpBase(v, part), stage: step, n: 1 });
	}
	if (step === 'stable') {
		if (!v.stage) throw new Error(`${current} is already stable`);
		return format({ ...v, stage: null, n: 0 });
	}
	if (['patch', 'minor', 'major'].includes(step)) {
		if (v.stage) throw new Error(`finish ${current} with "stable" first`);
		return format({ ...bumpBase(v, step), stage: null, n: 0 });
	}
	throw new Error(`unknown step ${step}`);
}

function readVersion() {
	return JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
}

function requireCleanMain() {
	if (run('git', ['branch', '--show-current']) !== 'main') fail('switch to main first');
	if (run('git', ['status', '--porcelain'])) fail('working tree is not clean');
	run('git', ['fetch', '-q', 'origin', 'main']);
	if (run('git', ['rev-parse', 'HEAD']) !== run('git', ['rev-parse', 'origin/main'])) fail('main is not in sync with origin/main');
}

function bump(step, part) {
	requireCleanMain();
	const current = readVersion();
	let target;
	try {
		target = next(current, step, part);
	} catch (e) {
		fail(e.message);
	}
	const branch = `chore/release-v${target}`;
	run('git', ['switch', '-q', '-c', branch]);
	for (const file of MANIFESTS) {
		const path = join(root, file);
		const pkg = JSON.parse(readFileSync(path, 'utf8'));
		pkg.version = target;
		writeFileSync(path, JSON.stringify(pkg, null, '\t') + '\n');
	}
	run('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund']);
	run('git', ['add', ...MANIFESTS, 'package-lock.json']);
	run('git', ['commit', '-q', '-m', `Release v${target}`]);
	run('git', ['push', '-q', '-u', 'origin', branch], { stdio: 'inherit' });
	const url = run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', `Release v${target}`, '--body', `Version ${current} → ${target}.`]);
	console.log(`v${current} → v${target}: ${url}`);
	console.log('After merging: git switch main && git pull --ff-only && npm run release -- publish');
}

function releaseExists(tag) {
	try {
		run('gh', ['release', 'view', tag, '--json', 'tagName'], { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
}

// GitHub can take a moment to see a pushed tag.
function waitForRemoteTag(tag) {
	for (let i = 0; i < 20; i++) {
		if (run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) return;
		execFileSync('sleep', ['1']);
	}
	fail(`${tag} not visible on origin`);
}

function publish(notesFile) {
	requireCleanMain();
	const version = readVersion();
	const tag = `v${version}`;
	if (releaseExists(tag)) fail(`release ${tag} already exists`);
	const head = run('git', ['rev-parse', 'HEAD']);
	if (run('git', ['tag', '--list', tag])) {
		if (run('git', ['rev-parse', `${tag}^{commit}`]) !== head) fail(`${tag} exists on another commit`);
	} else {
		run('git', ['tag', '-a', tag, '-m', tag]);
	}
	if (!run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) run('git', ['push', '-q', 'origin', tag], { stdio: 'inherit' });
	waitForRemoteTag(tag);
	const sha = head.slice(0, 7);
	const args = ['release', 'create', tag, '--title', tag, '--generate-notes', '--verify-tag'];
	if (parse(version).stage) args.push('--prerelease');
	if (notesFile) args.push('--notes-file', notesFile);
	console.log(`${tag} (${sha}): ${run('gh', args)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [step, ...rest] = process.argv.slice(2);
	if (step === 'publish') {
		const i = rest.indexOf('--notes');
		publish(i >= 0 ? rest[i + 1] : undefined);
	} else if (step) {
		bump(step, rest[0]);
	} else {
		fail('usage: npm run release -- <alpha|beta|rc|stable|patch|minor|major> [patch|minor|major] | publish [--notes <file>]');
	}
}
