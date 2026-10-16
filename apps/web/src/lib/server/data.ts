import { and, eq, ne, sql } from 'drizzle-orm';
import type { DataCategory, DataResets } from '#lib/data/categories.ts';
import { db, schema } from './db/index.ts';

/*
 * Clearing one category of account data. The rows are deleted and the time is recorded, so that
 * copies still held by a browser (results, the finger map and usage statistics are kept in the
 * browser as well) are discarded there instead of being uploaded again.
 */

/** Deletes one category of the user's data and records when it was cleared. */
export async function clearCategory(userId: string, category: DataCategory): Promise<Date> {
	const d = await db();
	const now = new Date();
	await d.transaction(async (tx) => {
		switch (category) {
			case 'learning':
				await tx.delete(schema.courseProgress).where(eq(schema.courseProgress.userId, userId));
				await tx.delete(schema.courseDays).where(eq(schema.courseDays.userId, userId));
				await tx.delete(schema.courseState).where(eq(schema.courseState.userId, userId));
				break;
			case 'practice':
				await tx.delete(schema.results).where(and(eq(schema.results.userId, userId), ne(schema.results.exam, 'competitive')));
				break;
			case 'ranked':
				await tx.delete(schema.results).where(and(eq(schema.results.userId, userId), eq(schema.results.exam, 'competitive')));
				break;
			case 'fingermap':
				await tx.delete(schema.fingerMaps).where(eq(schema.fingerMaps.userId, userId));
				break;
			case 'usage':
				await tx.delete(schema.usageStats).where(eq(schema.usageStats.userId, userId));
				break;
		}
		await tx
			.insert(schema.dataResets)
			.values({ userId, category, clearedAt: now })
			.onConflictDoUpdate({ target: [schema.dataResets.userId, schema.dataResets.category], set: { clearedAt: now } });
	});
	return now;
}

/** When each category of the user's data was last cleared. */
export async function dataResets(userId: string): Promise<DataResets> {
	const rows = await (await db()).select().from(schema.dataResets).where(eq(schema.dataResets.userId, userId));
	return Object.fromEntries(rows.map((r) => [r.category, r.clearedAt.getTime()]));
}

/** The time a category was last cleared, or 0. */
export async function clearedAt(userId: string, category: DataCategory): Promise<number> {
	const rows = await (await db())
		.select({ at: schema.dataResets.clearedAt })
		.from(schema.dataResets)
		.where(and(eq(schema.dataResets.userId, userId), eq(schema.dataResets.category, category)))
		.limit(1);
	return rows[0]?.at.getTime() ?? 0;
}

/** How much is stored in each category, for the Your data page. */
export async function dataCounts(userId: string): Promise<Record<DataCategory, number>> {
	const res = await (await db()).execute(sql`
		select
			(select count(*) from course_progress where user_id = ${userId} and stars > 0)::int as learning,
			(select count(*) from results where user_id = ${userId} and exam <> 'competitive')::int as practice,
			(select count(*) from results where user_id = ${userId} and exam = 'competitive')::int as ranked,
			(select coalesce(jsonb_array_length(observations), 0) from finger_maps where user_id = ${userId})::int as fingermap,
			(select count(*) from usage_stats where user_id = ${userId})::int as usage
	`);
	const row = ((res as unknown as { rows: Record<string, unknown>[] }).rows[0] ?? {}) as Record<string, unknown>;
	return {
		learning: Number(row.learning ?? 0),
		practice: Number(row.practice ?? 0),
		ranked: Number(row.ranked ?? 0),
		fingermap: Number(row.fingermap ?? 0),
		usage: Number(row.usage ?? 0)
	};
}
