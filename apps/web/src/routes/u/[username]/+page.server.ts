import { error } from '@sveltejs/kit';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { buildProfile } from '@sqwer/fingermap';
import { qwertyAnsi, type Platform } from '@sqwer/layouts';
import { lessonPoints, localDay, rankFor, streak } from '#lib/courses/progression.ts';
import { avatarUrl } from '#lib/server/avatar.ts';
import { db, schema } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const d = await db();
	const [row] = await d
		.select({ profile: schema.profiles, createdAt: schema.users.createdAt })
		.from(schema.profiles)
		.innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
		.where(and(eq(schema.profiles.username, params.username.toLowerCase()), eq(schema.profiles.isPublic, true), isNull(schema.users.suspendedAt)))
		.limit(1);
	if (!row) error(404, 'This profile does not exist or is private.');

	const [fm] = await d.select().from(schema.fingerMaps).where(eq(schema.fingerMaps.userId, row.profile.userId));
	const summary = fm?.observations.length
		? buildProfile(fm.observations, qwertyAnsi(row.profile.platform as Platform))
		: null;

	const p = row.profile;
	const userId = p.userId;

	// Only what the owner chose to show is read.
	let points = 0;
	let lessons = 0;
	let starsList: number[] = [];
	if (p.showRank || p.showStats) {
		const progress = await d.select({ stars: schema.courseProgress.stars }).from(schema.courseProgress).where(eq(schema.courseProgress.userId, userId));
		points = progress.reduce((sum, r) => sum + lessonPoints(r.stars), 0);
		starsList = progress.map((r) => r.stars);
		lessons = progress.filter((r) => r.stars > 0).length;
	}
	let best: { wpm: number | null; accuracy: number | null; tests: number } | null = null;
	if (p.showStats) {
		const [r] = await d
			.select({
				wpm: sql<number | null>`max((${schema.results.data}->>'wpm')::float)`,
				accuracy: sql<number | null>`max((${schema.results.data}->>'accuracy')::float)`,
				tests: sql<number>`count(*)::int`
			})
			.from(schema.results)
			.where(and(eq(schema.results.userId, userId), sql`${schema.results.data}->>'status' = 'completed'`));
		best = { wpm: r?.wpm ?? null, accuracy: r?.accuracy ?? null, tests: r?.tests ?? 0 };
	}
	let dayStreak: number | null = null;
	if (p.showStreak) {
		const days = await d.select({ day: schema.courseDays.day }).from(schema.courseDays).where(eq(schema.courseDays.userId, userId));
		dayStreak = streak(days.map((x) => x.day), localDay());
	}

	return {
		showcase: {
			rank: p.showRank ? { status: rankFor(points, starsList) } : null,
			stats: p.showStats ? { lessons, ...best! } : null,
			streak: dayStreak
		},
		publicProfile: {
			displayName: p.displayName,
			username: p.username,
			bio: p.bio,
			avatarColor: p.avatarColor,
			headline: p.headline,
			pronouns: p.pronouns,
			banner: p.banner,
			experience: p.experience,
			goal: p.goal,
			targetWpm: p.targetWpm,
			platform: p.platform,
			memberSince: row.createdAt.toISOString(),
			avatar: await avatarUrl(p.userId)
		},
		fingerMap: summary
			? {
					coverage: Math.round((summary.core.mapped / summary.core.total) * 100),
					keysOwnWay: Object.values(summary.keys).filter((k) => k.mapped && k.differs && !k.code.startsWith('Shift')).length,
					habits: summary.rules.length
				}
			: null
	};
};
