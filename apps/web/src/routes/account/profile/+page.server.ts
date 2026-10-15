import { fail, redirect } from '@sveltejs/kit';
import { requireUser, saveProfile, usernameTaken } from '#lib/server/account.ts';
import { avatarUrl, deleteAvatar, saveAvatar, validateAvatar } from '#lib/server/avatar.ts';
import { rateLimit, rateLimitMessage } from '#lib/server/rate-limit.ts';
import { fieldErrors, readProfileForm } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	return { avatar: await avatarUrl(user.id) };
};

export const actions: Actions = {
	save: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const parsed = readProfileForm(await request.formData());
		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });
		if (await usernameTaken(parsed.data.username, user.id)) {
			return fail(400, { errors: { username: 'This username is already taken.' } });
		}
		await saveProfile(user.id, parsed.data);
		redirect(303, '/account/profile?saved=1');
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
