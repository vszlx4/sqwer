import { fail } from '@sveltejs/kit';
import { requireUser, saveProfilePart } from '#lib/server/account.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	save: async ({ request, locals, url }) => {
		const user = requireUser(locals, url);
		const errors = await saveProfilePart(user.id, await request.formData(), 'privacy');
		if (errors) return fail(400, { errors });
		return { saved: true };
	}
};
