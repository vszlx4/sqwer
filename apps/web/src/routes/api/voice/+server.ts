import { error, json } from '@sveltejs/kit';
import { DATA_DIR } from '#lib/server/config.ts';
import { nudgeVoiceGenerator } from '#lib/server/voice/background.ts';
import { checkClips } from '#lib/server/voice/health.ts';
import { isLocalRequest } from '#lib/server/voice/local.ts';
import { buildManifest, findListsDir, fullSet } from '#lib/server/voice/manifest.ts';
import { activeVoice, readSettings, voiceDir, writeSettings } from '#lib/server/voice/settings.ts';
import { forgetCounts, voiceBrief, voiceStatus } from '#lib/server/voice/status.ts';
import type { VoiceAction, VoiceRemote } from '#lib/voice/status.ts';
import type { RequestHandler } from './$types';

const VOICE_DIR = voiceDir(DATA_DIR);
const SET_ID = /^[a-z0-9-]{1,40}$/;

const setParam = (url: URL) => {
	const set = url.searchParams.get('set');
	return set && SET_ID.test(set) ? set : undefined;
};

/** Voice status: the details for the machine running the copy, only the voice in use for anyone else. */
export const GET: RequestHandler = async (event) => {
	const headers = { 'Cache-Control': 'no-store' };
	if (!isLocalRequest(event)) return json({ local: false, voice: activeVoice(readSettings(DATA_DIR)) } satisfies VoiceRemote, { headers });
	if (event.url.searchParams.has('brief')) return json({ local: true, brief: voiceBrief(DATA_DIR) }, { headers });
	return json(await voiceStatus(DATA_DIR, setParam(event.url)), { headers });
};

function parse(body: unknown): VoiceAction | null {
	if (!body || typeof body !== 'object') return null;
	const b = body as Record<string, unknown>;
	switch (b.action) {
		case 'use':
			return b.voice === 'standard' || b.voice === 'supertonic' ? { action: 'use', voice: b.voice } : null;
		case 'pause':
		case 'resume':
			return { action: b.action };
		case 'mode':
			return b.mode === 'low' || b.mode === 'active' ? { action: 'mode', mode: b.mode } : null;
		case 'first':
			return typeof b.set === 'string' && SET_ID.test(b.set) ? { action: 'first', set: b.set } : null;
		case 'check':
			return b.set === undefined || (typeof b.set === 'string' && SET_ID.test(b.set)) ? { action: 'check', set: b.set as string | undefined } : null;
		default:
			return null;
	}
}

/** Changes the voice settings or runs the health check. JSON only, same origin, from the machine running the copy. */
export const POST: RequestHandler = async (event) => {
	const { request, url } = event;
	if (!isLocalRequest(event)) error(403, 'Voice settings can be changed only on the computer running this copy of sqwer.');
	const origin = request.headers.get('origin');
	if ((origin && origin !== url.origin) || !request.headers.get('content-type')?.startsWith('application/json')) error(403, 'Not allowed.');
	const action = parse(await request.json().catch(() => null));
	if (!action) error(400, 'Unknown voice action.');

	const listsDir = findListsDir();
	let report;
	switch (action.action) {
		case 'use':
			// Switching back keeps every clip; the generator stops after the current word.
			await writeSettings(DATA_DIR, action.voice === 'supertonic' ? { voice: 'supertonic', paused: false } : { voice: 'standard', first: null });
			break;
		case 'pause':
		case 'resume':
			await writeSettings(DATA_DIR, { paused: action.action === 'pause' });
			break;
		case 'mode':
			await writeSettings(DATA_DIR, { mode: action.mode });
			break;
		case 'first': {
			if (readSettings(DATA_DIR).voice !== 'supertonic') error(409, 'Choose the Supertonic voice first.');
			if (!fullSet(listsDir, action.set, [])) error(400, 'Unknown set.');
			await writeSettings(DATA_DIR, { first: action.set, paused: false });
			break;
		}
		case 'check': {
			const manifest = buildManifest(listsDir);
			const only = action.set ? fullSet(listsDir, action.set, manifest) : undefined;
			if (only === null) error(400, 'Unknown set.');
			report = await checkClips(VOICE_DIR, manifest, only);
			forgetCounts(VOICE_DIR);
			break;
		}
	}
	nudgeVoiceGenerator();
	return json({ status: await voiceStatus(DATA_DIR, setParam(url)), report }, { headers: { 'Cache-Control': 'no-store' } });
};
