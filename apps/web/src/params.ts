import { defineParams } from '@sveltejs/kit/params';
import { isPracticeTest } from '#lib/exams.ts';

/** Route parameter matchers. exam: /practice/test/<exam>, the typing tests listed under Practice; any other is a 404. */
export const params = defineParams({
	exam: (param) => (isPracticeTest(param) ? param : undefined)
});
