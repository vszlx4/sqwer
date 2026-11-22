/*
 * Whether this computer runs on battery: macOS asks pmset, Linux reads /sys/class/power_supply. Anything else, or a
 * machine without a battery, counts as plugged in. Read at most every half minute.
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const EVERY_MS = 30_000;
let last: { at: number; battery: boolean } | null = null;

/** pmset -g ps: "Now drawing from 'Battery Power'" or "'AC Power'". */
export const pmsetOnBattery = (out: string) => /'Battery Power'/.test(out);

/** Linux: on battery when a mains supply exists and none is online. */
export function linuxOnBattery(root = '/sys/class/power_supply'): boolean {
	if (!existsSync(root)) return false;
	const mains = readdirSync(root).filter((d) => {
		try {
			return readFileSync(path.join(root, d, 'type'), 'utf8').trim() === 'Mains';
		} catch {
			return false;
		}
	});
	if (!mains.length) return false;
	return mains.every((d) => {
		try {
			return readFileSync(path.join(root, d, 'online'), 'utf8').trim() !== '1';
		} catch {
			return false;
		}
	});
}

function read(platform: NodeJS.Platform): Promise<boolean> {
	if (platform === 'linux') return Promise.resolve(linuxOnBattery());
	if (platform !== 'darwin') return Promise.resolve(false);
	return new Promise((resolve) => {
		execFile('/usr/bin/pmset', ['-g', 'ps'], { timeout: 3000 }, (err, out) => resolve(!err && pmsetOnBattery(String(out))));
	});
}

/** On battery now, from a reading at most half a minute old. */
export async function onBattery(platform = process.platform): Promise<boolean> {
	if (last && Date.now() - last.at < EVERY_MS) return last.battery;
	const battery = await read(platform);
	last = { at: Date.now(), battery };
	return battery;
}

/** The last reading, without asking again (false before the first). */
export const lastBattery = () => last?.battery ?? false;
