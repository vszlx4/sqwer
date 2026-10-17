import { sql } from 'drizzle-orm';
import { POINTS_PER_LESSON, POINTS_PER_STAR } from '#lib/courses/progression.ts';
import { levelFor, type LevelStatus } from '#lib/progress/xp.ts';
import { db } from './db/index.ts';

/*
 * Account level, competitive bests and leaderboards. XP is the sum of course points and the XP of
 * examinations; both are stored on the server, so the figures cannot be edited in the browser.
 */

type Row = Record<string, unknown>;
const rowsOf = (r: unknown) => (r as { rows: Row[] }).rows;

/**
 * The leaderboards are the same for every visitor and need a pass over all listed players, so they
 * are computed at most once per PUBLIC_TTL_MS. Anything that changes who is listed or a listed
 * speed (a verified competitive result, a profile change, cleared ranked results, a deleted account)
 * calls invalidateLeaderboards(), so changes, and above all withdrawals, show at once.
 */
const PUBLIC_TTL_MS = 30_000;
const publicCache = new Map<string, { at: number; value: Promise<unknown> }>();
function cachedPublic<T>(key: string, compute: () => Promise<T>): Promise<T> {
	const hit = publicCache.get(key);
	if (hit && Date.now() - hit.at < PUBLIC_TTL_MS) return hit.value as Promise<T>;
	const value = compute();
	publicCache.set(key, { at: Date.now(), value });
	// A failed computation is not kept, so the next request tries again (unless already replaced).
	value.catch(() => {
		if (publicCache.get(key)?.value === value) publicCache.delete(key);
	});
	return value;
}

export function invalidateLeaderboards() {
	publicCache.clear();
}

/** Per-user XP as a SQL fragment: examination XP, course points and any XP granted to the account. */
const XP_OF = (user: ReturnType<typeof sql>) => sql`(
	coalesce((select sum(r.xp) from results r where r.user_id = ${user}), 0)
	+ coalesce((select sum(g.xp) from xp_grants g where g.user_id = ${user}), 0)
	+ coalesce((select sum(${POINTS_PER_LESSON} + ${POINTS_PER_STAR} * c.stars) from course_progress c where c.user_id = ${user} and c.stars > 0), 0)
)`;

export async function accountLevel(userId: string): Promise<LevelStatus> {
	const res = await (await db()).execute(sql`select ${XP_OF(sql`${userId}`)}::int as xp`);
	return levelFor(Number(rowsOf(res)[0]?.xp ?? 0));
}

export interface PaceSummary {
	/** Completed tests of any kind. */
	tests: number;
	/** Average speed and accuracy over the last twenty completed tests, or null without any. */
	wpm: number | null;
	accuracy: number | null;
}

/** A short summary of the player's tests, for the level card in the account menu. */
export async function paceSummary(userId: string): Promise<PaceSummary> {
	const res = await (await db()).execute(sql`
		select
			(select count(*) from results where user_id = ${userId} and data->>'status' = 'completed')::int as tests,
			avg(t.wpm) as wpm,
			avg(t.accuracy) as accuracy
		from (
			select wpm, (data->>'accuracy')::float as accuracy from results
			where user_id = ${userId} and data->>'status' = 'completed'
			order by created_at desc limit 20
		) t
	`);
	const row = rowsOf(res)[0] ?? {};
	return {
		tests: Number(row.tests ?? 0),
		wpm: row.wpm == null ? null : Number(row.wpm),
		accuracy: row.accuracy == null ? null : Number(row.accuracy)
	};
}

/** The best verified competitive speed, or null. */
export async function competitiveBest(userId: string): Promise<number | null> {
	const res = await (await db()).execute(
		sql`select max(wpm) as best from results where user_id = ${userId} and exam = 'competitive' and verified`
	);
	const best = rowsOf(res)[0]?.best;
	return best == null ? null : Number(best);
}

export interface LeaderboardEntry {
	position: number;
	username: string;
	displayName: string;
	avatarColor: string;
	avatar: string | null;
	isPublic: boolean;
	level: number;
	xp: number;
	wpm: number | null;
}

/**
 * The top typists, by best verified competitive speed or by XP. Only people with a profile who
 * have not switched off "Appear on leaderboards" are listed; profiles link only when public.
 */
export function leaderboard(by: 'speed' | 'xp', limit = 100): Promise<LeaderboardEntry[]> {
	return cachedPublic(`leaderboard:${by}:${limit}`, () => computeLeaderboard(by, limit));
}

async function computeLeaderboard(by: 'speed' | 'xp', limit: number): Promise<LeaderboardEntry[]> {
	const best = sql`(select max(r.wpm) from results r where r.user_id = p.user_id and r.exam = 'competitive' and r.verified)`;
	const xp = XP_OF(sql`p.user_id`);
	const res = await (await db()).execute(sql`
		select p.username, p.display_name, p.avatar_color, p.is_public,
			a.updated_at as avatar_at, p.user_id,
			${best} as best, ${xp}::int as xp
		from profiles p
		left join avatars a on a.user_id = p.user_id
		where p.show_on_leaderboard
			and ${by === 'speed' ? sql`${best} is not null` : sql`${xp} > 0`}
		order by ${by === 'speed' ? sql`${best} desc, ${xp} desc` : sql`${xp} desc, ${best} desc nulls last`}
		limit ${limit}
	`);
	return rowsOf(res).map((r, i) => {
		const total = Number(r.xp ?? 0);
		const at = r.avatar_at ? new Date(r.avatar_at as string).getTime() : null;
		return {
			position: i + 1,
			username: String(r.username),
			displayName: String(r.display_name),
			avatarColor: String(r.avatar_color),
			avatar: at ? `/avatars/${String(r.user_id)}?v=${at}` : null,
			isPublic: Boolean(r.is_public),
			level: levelFor(total).level,
			xp: total,
			wpm: r.best == null ? null : Number(r.best)
		};
	});
}

/** Best verified competitive speed of every listed player, for the distribution across ranks. */
export function competitiveBests(): Promise<number[]> {
	return cachedPublic('bests', async () => (await listedBests()).map((r) => r.best));
}

function listedBests(): Promise<{ userId: string; best: number }[]> {
	return cachedPublic('listed', computeListedBests);
}

async function computeListedBests(): Promise<{ userId: string; best: number }[]> {
	const res = await (await db()).execute(sql`
		select r.user_id, max(r.wpm) as best from results r
		join profiles p on p.user_id = r.user_id and p.show_on_leaderboard
		where r.exam = 'competitive' and r.verified
		group by r.user_id
	`);
	return rowsOf(res).map((r) => ({ userId: String(r.user_id), best: Number(r.best) }));
}

/**
 * A player's place on the speed leaderboard: one more than the number of faster players. Null
 * when the player has no verified result or does not appear on the leaderboards.
 */
export async function competitiveStanding(userId: string): Promise<{ position: number; players: number } | null> {
	const all = await listedBests();
	const mine = all.find((r) => r.userId === userId);
	if (!mine) return null;
	return { position: all.filter((r) => r.best > mine.best).length + 1, players: all.length };
}
