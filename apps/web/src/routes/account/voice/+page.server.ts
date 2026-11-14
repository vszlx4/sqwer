import { requireUser } from '#lib/server/account.ts';
import { DATA_DIR } from '#lib/server/config.ts';
import { isLocalRequest } from '#lib/server/voice/local.ts';
import { activeVoice, readSettings } from '#lib/server/voice/settings.ts';
import { voiceStatus } from '#lib/server/voice/status.ts';
import type { VoiceInfo } from '#lib/voice/status.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	requireUser(event.locals, event.url);
	// Counting clips can take a moment on a big install: the page streams it in.
	const status: Promise<VoiceInfo> = isLocalRequest(event)
		? voiceStatus(DATA_DIR)
		: Promise.resolve({ local: false, voice: activeVoice(readSettings(DATA_DIR)) });
	return { status };
};
