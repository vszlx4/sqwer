/*
 * The running site makes Supertonic clips in a child process while that voice is chosen and not paused, so the
 * model's work never blocks requests. The settings are checked every half minute, and at once when the screens change
 * them; the child stops after the current word once the voice is switched back, paused, set to another mode or given
 * a set to make first, and a new one starts with the new settings. Nothing starts while Standard is chosen, or once
 * every clip is made (until the next restart).
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.ts';
import { isLocked, readState } from './generator.ts';
import { findListsDir } from './manifest.ts';
import { readSettings, shouldGenerate, voiceDir } from './settings.ts';

const CHECK_MS = 30_000;

let child: ChildProcess | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const startedAt = Date.now();

/** apps/web/scripts/voice.ts, from the repo root that holds packages/content/lists. */
function script(): string | null {
	try {
		const file = path.join(findListsDir(), '..', '..', '..', 'apps', 'web', 'scripts', 'voice.ts');
		return existsSync(file) ? file : null;
	} catch {
		return null;
	}
}

/** Every clip of every set made since this process started: no model load just to find nothing missing. */
function allMade(): boolean {
	const st = readState(voiceDir(DATA_DIR));
	return !!st && st.all === true && !st.running && !st.error && st.total > 0 && st.made >= st.total && Date.parse(st.updatedAt) > startedAt;
}

function check() {
	// Another generator (a voice:sync) already making clips: nothing to start.
	const settings = readSettings(DATA_DIR);
	if (child || !shouldGenerate(settings) || isLocked(voiceDir(DATA_DIR)) || (allMade() && !settings.first)) return;
	const file = script();
	if (!file) return;
	child = spawn(process.execPath, [file, 'run'], {
		cwd: path.dirname(path.dirname(file)),
		env: { ...process.env, SQWER_DATA_DIR: DATA_DIR },
		stdio: ['ignore', 'ignore', 'inherit']
	});
	child.on('exit', (code) => {
		child = null;
		// Stopped for new settings, or a set made first is done: carry on with the rest. A crash waits for the timer.
		if (code === 0) setTimeout(check, 1000).unref();
	});
}

/** Looks at the settings now instead of at the next half minute. */
export function nudgeVoiceGenerator(): void {
	if (timer) check();
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
