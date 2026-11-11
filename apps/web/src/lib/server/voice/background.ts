/*
 * The running site makes Supertonic clips in a child process while that voice is chosen and not paused, so the
 * model's work never blocks requests. The settings are checked every half minute; the child itself stops after the
 * current word once the voice is switched back or paused. Nothing starts while Standard is chosen.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.ts';
import { findListsDir } from './manifest.ts';
import { readSettings, shouldGenerate } from './settings.ts';

const CHECK_MS = 30_000;

let child: ChildProcess | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/** apps/web/scripts/voice.ts, from the repo root that holds packages/content/lists. */
function script(): string | null {
	try {
		const file = path.join(findListsDir(), '..', '..', '..', 'apps', 'web', 'scripts', 'voice.ts');
		return existsSync(file) ? file : null;
	} catch {
		return null;
	}
}

function check() {
	if (child || !shouldGenerate(readSettings(DATA_DIR))) return;
	const file = script();
	if (!file) return;
	child = spawn(process.execPath, [file, 'run'], {
		cwd: path.dirname(path.dirname(file)),
		env: { ...process.env, SQWER_DATA_DIR: DATA_DIR },
		stdio: ['ignore', 'ignore', 'inherit']
	});
	child.on('exit', () => (child = null));
}

/** Starts watching the voice settings; safe to call more than once. */
export function startVoiceGenerator(): void {
	if (timer || process.env.VITEST) return;
	check();
	timer = setInterval(check, CHECK_MS);
	timer.unref();
	const stop = () => child?.kill();
	process.once('exit', stop);
}
