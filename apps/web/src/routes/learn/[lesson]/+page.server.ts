import { error } from '@sveltejs/kit';
import { FIRST_LESSON, lessonById } from '#lib/courses/catalog.ts';
import type { PageServerLoad } from './$types';

/** Course lessons need an account; the first lesson can be tried without one. */
export const load: PageServerLoad = ({ params, locals }) => {
	const lesson = lessonById(params.lesson);
	if (!lesson) error(404, 'This lesson does not exist.');
	return { lessonId: lesson.id, allowed: !!locals.user || lesson.id === FIRST_LESSON.id };
};
