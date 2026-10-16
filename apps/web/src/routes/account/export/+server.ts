import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { requireUser } from '#lib/server/account.ts';
import { activeSessions } from '#lib/server/auth.ts';
import { accountLevel, competitiveBest } from '#lib/server/progress.ts';
import type { RequestHandler } from './$types';

/** Data portability: everything stored about the signed-in account, as JSON. */
export const GET: RequestHandler = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	const d = await db();
	const [profile] = await d.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
	const [fingerMap] = await d.select().from(schema.fingerMaps).where(eq(schema.fingerMaps.userId, user.id));
	const sessions = await activeSessions(user.id);
	const [avatar] = await d.select().from(schema.avatars).where(eq(schema.avatars.userId, user.id));
	const savedResults = await d.select({ data: schema.results.data, xp: schema.results.xp, verified: schema.results.verified }).from(schema.results).where(eq(schema.results.userId, user.id));
	const usageRows = await d.select({ deviceId: schema.usageStats.deviceId, data: schema.usageStats.data }).from(schema.usageStats).where(eq(schema.usageStats.userId, user.id));
	const courseRows = await d.select().from(schema.courseProgress).where(eq(schema.courseProgress.userId, user.id));
	const courseDays = await d.select({ day: schema.courseDays.day }).from(schema.courseDays).where(eq(schema.courseDays.userId, user.id));
	const [courseState] = await d.select().from(schema.courseState).where(eq(schema.courseState.userId, user.id));
	const security = await d
		.select({ type: schema.securityEvents.type, device: schema.securityEvents.device, at: schema.securityEvents.createdAt })
		.from(schema.securityEvents)
		.where(eq(schema.securityEvents.userId, user.id));
	// Recovery codes are stored only as hashes, so their use is exported rather than the codes.
	const [consent] = await d
		.select({ termsVersion: schema.users.termsVersion, termsAcceptedAt: schema.users.termsAcceptedAt, ageConfirmedAt: schema.users.ageConfirmedAt })
		.from(schema.users)
		.where(eq(schema.users.id, user.id));
	const codes = await d.select({ usedAt: schema.recoveryCodes.usedAt }).from(schema.recoveryCodes).where(eq(schema.recoveryCodes.userId, user.id));
	const body = {
		exportedAt: new Date().toISOString(),
		account: { email: user.email, createdAt: user.createdAt },
		acceptance: consent ?? null,
		progress: { ...(await accountLevel(user.id)), bestCompetitiveWpm: await competitiveBest(user.id) },
		profile: profile ? { ...profile, userId: undefined } : null,
		devices: sessions.map((s) => ({ device: s.device, signedInAt: s.createdAt, lastActiveAt: s.lastSeenAt })),
		fingerMap: fingerMap ? { updatedAt: fingerMap.updatedAt, observations: fingerMap.observations } : null,
		results: savedResults.map((r) => ({ ...(r.data as object), xp: r.xp, verified: r.verified })),
		usageStatistics: usageRows.map((r) => r.data),
		course: {
			level: courseState?.level ?? null,
			startLesson: courseState?.startLesson ?? null,
			lessons: courseRows.map((r) => ({ ...r, userId: undefined })),
			practiceDays: courseDays.map((r) => r.day)
		},
		securityActivity: security,
		recoveryCodes: { total: codes.length, used: codes.filter((c) => c.usedAt).map((c) => c.usedAt) },
		profilePicture: avatar
			? { type: avatar.mime, base64: avatar.data, updatedAt: avatar.updatedAt, rightsConfirmedAt: avatar.rightsConfirmedAt }
			: null
	};
	return new Response(JSON.stringify(body, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="sqwer-account-data-${new Date().toISOString().slice(0, 10)}.json"`,
			'Cache-Control': 'private, no-store'
		}
	});
};
