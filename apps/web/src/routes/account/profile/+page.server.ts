import { fail } from '@sveltejs/kit';
import { requireUser, saveProfilePart } from '#lib/server/account.ts';
import { avatarUrl, deleteAvatar, saveAvatar, validateAvatar } from '#lib/server/avatar.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	return { avatar: await avatarUrl(user.id) };
};

export const actions: Actions = {
	/** Name, username, headline, pronouns, bio, banner and color; course and privacy stay as saved. */
	save: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const errors = await saveProfilePart(user.id, await request.formData(), 'profile');
		if (errors) return fail(400, { errors });
		return { saved: true };
	},

	avatar: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const limit = rateLimit(`avatar:${user.id}`, 20, 60 * 60 * 1000);
		if (!limit.ok) return fail(429, { avatarError: rateLimitMessage(limit.retryAfter) });
		const form = await request.formData();
		const file = form.get('avatar');
		if (!(file instanceof File)) return fail(400, { avatarError: 'Select an image to upload.' });
		if (form.get('rightsConfirm') !== 'on') {
			return fail(400, { avatarError: 'Confirm that you hold the rights to this image before uploading it.' });
		}
		const checked = await validateAvatar(file);
		if ('error' in checked) return fail(400, { avatarError: checked.error });
		await saveAvatar(user.id, checked.mime, checked.bytes);
		return { avatarSaved: true };
	},

	removeAvatar: async ({ locals, url }) => {
		const user = requireUser(locals, url);
		await deleteAvatar(user.id);
		return { avatarRemoved: true };
	}
};
