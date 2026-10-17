import { fail, redirect } from '@sveltejs/kit';
import { track } from '#lib/server/analytics/track.ts';
import { getProfile, requireUser, saveProfile, usernameTaken } from '#lib/server/account.ts';
import { fieldErrors, readProfileForm } from '#lib/server/validation.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	if (await getProfile(user.id)) redirect(303, '/account/profile');
	const base = user.email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
	return { suggestedUsername: base.length >= 3 ? base : '' };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const parsed = readProfileForm(await request.formData());
		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });
		if (await usernameTaken(parsed.data.username, user.id)) {
			return fail(400, { errors: { username: 'This username is already taken.' } });
		}
		await saveProfile(user.id, parsed.data);
		track('profile_completed', { userId: user.id });
		redirect(303, '/account?welcome=1');
	}
};
