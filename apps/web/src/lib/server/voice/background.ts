/*
 * The running site makes Supertonic clips in a child process while that voice is chosen and not paused, so the
 * model's work never blocks requests. The settings are checked every half minute, and at once when the screens change
 * them; the child stops after the current clip once the voice is switched back, paused or given other settings, and
 * a new one starts with them. Nothing starts while Standard is chosen, once the chosen sets are made (until they or the
 * clip format change, or the site restarts), at the disk limit, or on battery unless allowed. In low mode on macOS
 * the child runs at background priority, which keeps it on the efficiency cores. While the site renders a Standard
 * word someone is waiting for, the child is held (SIGSTOP, then SIGCONT), so the two never share the cores.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config.ts';
import { onRendering } from '../voice.ts';
import { isLocked, readState, runKey } from './generator.ts';
import { findListsDir } from './manifest.ts';
import { onBattery } from './power.ts';
import { maxClips, readSettings, shouldGenerate, voiceDir, type VoiceSettings } from './settings.ts';

const CHECK_MS = 30_000;

let child: ChildProcess | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
/** Words being rendered for someone right now. */
let rendering = false;
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

/** The chosen sets were all made since this process started: nothing to start until they change. */
function finished(settings: VoiceSettings): boolean {
	const st = readState(voiceDir(DATA_DIR));
	return !!st?.complete && !st.running && !st.error && st.key === runKey(settings.sets) && Date.parse(st.updatedAt) > startedAt;
}

const TASKPOLICY = '/usr/sbin/taskpolicy';

/** The command for a run: in low mode on macOS, at background priority (efficiency cores, throttled I/O). */
export function runCommand(file: string, mode: VoiceSettings['mode'], platform = process.platform, exists = existsSync): [string, string[]] {
	const node: [string, string[]] = [process.execPath, [file, 'run']];
	return mode === 'low' && platform === 'darwin' && exists(TASKPOLICY) ? [TASKPOLICY, ['-b', node[0], ...node[1]]] : node;
}

let checking = false;

/** The last run stopped at the disk limit, and the limit has not changed since. */
function full(settings: VoiceSettings): boolean {
	const st = readState(voiceDir(DATA_DIR));
	return !!st?.full && !st.running && st.limit === maxClips(settings);
}

async function check() {
	if (checking) return;
	checking = true;
	try {
		await start();
	} finally {
		checking = false;
	}
}

async function start() {
	// Another generator (a voice:sync) already making clips: nothing to start.
	const settings = readSettings(DATA_DIR);
	if (child || !shouldGenerate(settings) || !settings.sets.length || isLocked(voiceDir(DATA_DIR)) || finished(settings) || full(settings)) return;
	if (!settings.battery && (await onBattery())) return;
	const file = script();
	if (!file || child) return;
	const [cmd, args] = runCommand(file, settings.mode);
	child = spawn(cmd, args, {
		cwd: path.dirname(path.dirname(file)),
		env: { ...process.env, SQWER_DATA_DIR: DATA_DIR },
		stdio: ['ignore', 'ignore', 'inherit']
	});
	if (rendering) hold(child, true);
	child.on('exit', (code) => {
		child = null;
		// Stopped for new settings: start again with them. A crash waits for the timer.
		if (code === 0) setTimeout(() => void check(), 1000).unref();
	});
}

/** Pauses or resumes a child. Windows has no stop signal: there the child keeps running. */
export function hold(proc: Pick<ChildProcess, 'kill' | 'exitCode' | 'signalCode'>, on: boolean, platform = process.platform): boolean {
	if (platform === 'win32' || proc.exitCode !== null || proc.signalCode !== null) return false;
	try {
		return proc.kill(on ? 'SIGSTOP' : 'SIGCONT');
	} catch {
		return false;
	}
}

/** Looks at the settings now instead of at the next half minute. */
export function nudgeVoiceGenerator(): void {
	if (timer) void check();
}

/** Starts watching the voice settings; safe to call more than once. */
export function startVoiceGenerator(): void {
	if (timer || process.env.VITEST) return;
	onRendering((busy) => {
		rendering = busy;
		if (child) hold(child, busy);
	});
	void check();
	timer = setInterval(() => void check(), CHECK_MS);
	timer.unref();
	// A held child takes the stop signal only once it runs again.
	const stop = () => {
		if (child) hold(child, false);
		child?.kill();
	};
	process.once('exit', stop);
}
