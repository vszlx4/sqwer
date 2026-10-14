import { and, eq } from 'drizzle-orm';
import { requireUser } from '#lib/server/account.ts';
import { db, schema } from '#lib/server/db/index.ts';
import { mergeUsage, type Usage } from '#lib/usage/types.ts';
import type { ResultRecord } from '#lib/results/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
	depends('app:usage');
	const user = requireUser(locals, url);
	const d = await db();
	const rows = await d.select({ data: schema.usageStats.data }).from(schema.usageStats).where(eq(schema.usageStats.userId, user.id));
	const saved = await d
		.select({ data: schema.results.data })
		.from(schema.results)
		.where(and(eq(schema.results.userId, user.id)));
	const list = saved.map((r) => r.data as ResultRecord).filter((r) => r.status !== 'abandoned');

	// Best and average speed per examination, from completed results.
	const byExam: Record<string, { best: number; average: number; accuracy: number; count: number }> = {};
	for (const r of list) {
		const e = (byExam[r.exam] ??= { best: 0, average: 0, accuracy: 0, count: 0 });
		e.best = Math.max(e.best, r.wpm);
		e.average += r.wpm;
		e.accuracy += r.accuracy;
		e.count++;
	}
	for (const e of Object.values(byExam)) {
		e.average /= e.count;
		e.accuracy /= e.count;
	}
	return { usage: mergeUsage(rows.map((r) => r.data as Usage)), devices: rows.length, byExam };
};
