import { boolean, date, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { FingerObservation } from '@sqwer/fingermap';

/*
 * RLS on every table with no policies: nothing reachable through a provider's data API. The owner
 * connection isn't restricted by it.
 */

const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: created(),
	passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).notNull().defaultNow(),
	/** Consecutive failed sign-ins; reset on success. */
	failedLogins: integer('failed_logins').notNull().default(0),
	/** Sign-in is refused until this time after repeated failures. */
	lockedUntil: timestamp('locked_until', { withTimezone: true }),
	/** Version of the Terms and Privacy Policy accepted at registration, and when (evidence of consent). */
	termsVersion: text('terms_version'),
	termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
	/** When the person confirmed they are at least 16 years old. */
	ageConfirmedAt: timestamp('age_confirmed_at', { withTimezone: true }),
	/** 'user' | 'admin'. Changed only via `npm run admin -w web`. */
	role: text('role').notNull().default('user'),
	/** When the account was suspended; a suspended account cannot sign in and all its sessions end. */
	suspendedAt: timestamp('suspended_at', { withTimezone: true }),
	suspendedReason: text('suspended_reason'),
	/**
	 * TOTP secret (RFC 6238), AES-256-GCM (lib/server/totp.ts). Required for admins. `totpPending` holds an
	 * unconfirmed secret.
	 */
	totpSecret: text('totp_secret'),
	totpPending: text('totp_pending'),
	totpEnabledAt: timestamp('totp_enabled_at', { withTimezone: true }),
	/** The last time step accepted, so a code can never be used twice. */
	totpLastStep: integer('totp_last_step')
}).enableRLS();

export const profiles = pgTable('profiles', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	username: text('username').notNull().unique(),
	displayName: text('display_name').notNull(),
	bio: text('bio').notNull().default(''),
	avatarColor: text('avatar_color').notNull().default('lime'),
	experience: text('experience').notNull(),
	goal: text('goal').notNull(),
	targetWpm: integer('target_wpm').notNull(),
	platform: text('platform').notNull(),
	isPublic: boolean('is_public').notNull().default(false),
	/** A short line under the name, for example "Learning to touch type for work". */
	headline: text('headline').notNull().default(''),
	pronouns: text('pronouns').notNull().default(''),
	/** Banner style of the profile card, one of BANNERS in lib/profile.ts. */
	banner: text('banner').notNull().default('lime'),
	/** What a public profile shows besides the basics. */
	showRank: boolean('show_rank').notNull().default(true),
	showStats: boolean('show_stats').notNull().default(true),
	showStreak: boolean('show_streak').notNull().default(true),
	/** Whether the person appears on the public leaderboards. */
	showOnLeaderboard: boolean('show_on_leaderboard').notNull().default(true),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

export const sessions = pgTable('sessions', {
	/** SHA-256 of the session token; the token itself only lives in the cookie. */
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: created(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
	/** Short browser description, e.g. "Chrome on macOS". */
	device: text('device').notNull().default(''),
	/** When this session passed the authenticator-app check (administrators only). */
	mfaVerifiedAt: timestamp('mfa_verified_at', { withTimezone: true })
}, (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expiry_idx').on(t.expiresAt)]).enableRLS();

export const recoveryCodes = pgTable('recovery_codes', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	codeHash: text('code_hash').notNull(),
	usedAt: timestamp('used_at', { withTimezone: true })
}, (t) => [index('recovery_codes_user_idx').on(t.userId)]).enableRLS();

export const fingerMaps = pgTable('finger_maps', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	observations: jsonb('observations').$type<FingerObservation[]>().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

/** Saved test and assessment results. `data` holds the full result record. */
export const results = pgTable('results', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	exam: text('exam').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	data: jsonb('data').notNull(),
	/** Experience earned by this result (lib/progress/xp.ts), worked out on the server. */
	xp: integer('xp').notNull().default(0),
	/** Words per minute, copied for ranking. */
	wpm: real('wpm').notNull().default(0),
	/** For competitive and placement results: whether the server's plausibility check passed. */
	verified: boolean('verified').notNull().default(false)
}, (t) => [index('results_competitive_idx').on(t.exam, t.verified, t.wpm), index('results_user_idx').on(t.userId, t.createdAt)]).enableRLS();

/** Usage statistics, one document per device so that totals can be added without double counting. */
export const usageStats = pgTable(
	'usage_stats',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		deviceId: text('device_id').notNull(),
		data: jsonb('data').notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.userId, t.deviceId] })]
).enableRLS();

/** Best result for each course lesson. Points and ranks are derived from these rows. */
export const courseProgress = pgTable(
	'course_progress',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		lessonId: text('lesson_id').notNull(),
		stars: integer('stars').notNull().default(0),
		bestAccuracy: integer('best_accuracy').notNull().default(0),
		bestWpm: integer('best_wpm').notNull().default(0),
		attempts: integer('attempts').notNull().default(0),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.userId, t.lessonId] })]
).enableRLS();

/** Calendar days (in the learner's time zone) on which a lesson was completed, for streaks. */
export const courseDays = pgTable(
	'course_days',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		day: text('day').notNull()
	},
	(t) => [primaryKey({ columns: [t.userId, t.day] })]
).enableRLS();

/** The learner's self-described level and chosen starting lesson. */
export const courseState = pgTable('course_state', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	level: text('level'),
	startLesson: text('start_lesson'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

/**
 * Analytics events, 13-month retention. Browser events after consent; account events server-side without
 * visitor ids. No IP, user agent, email or secrets.
 */
export const analyticsEvents = pgTable(
	'analytics_events',
	{
		/** A random identifier from the sender, so the same event is never stored twice. */
		id: text('id').primaryKey(),
		occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
		receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
		/** 'client' (the browser, with consent) or 'server'. */
		source: text('source').notNull(),
		/** 'pageview', 'engagement', or the name of an event such as 'signup_completed'. */
		name: text('name').notNull(),
		path: text('path'),
		/** The route pattern, such as /learn/[lesson], for grouping pages. */
		route: text('route'),
		referrerHost: text('referrer_host'),
		/** direct, search, social, referral or campaign. */
		channel: text('channel'),
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		/** A random identifier kept in the browser after consent; never derived from the person. */
		visitorId: text('visitor_id'),
		sessionId: text('session_id'),
		/** Set by the server from the signed-in session, never taken from the browser. */
		userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
		authenticated: boolean('authenticated').notNull().default(false),
		device: text('device'),
		browser: text('browser'),
		os: text('os'),
		/** For engagement events: time the page was visible. */
		durationMs: integer('duration_ms'),
		/** A few non-personal details, such as the examination of a completed test. */
		props: jsonb('props')
	},
	(t) => [
		index('analytics_time_idx').on(t.occurredAt),
		index('analytics_name_time_idx').on(t.name, t.occurredAt),
		index('analytics_route_time_idx').on(t.route, t.occurredAt),
		index('analytics_session_idx').on(t.sessionId),
		index('analytics_user_idx').on(t.userId)
	]
).enableRLS();

/** Daily totals, kept after raw events expire, for long-term trends. Contain no personal data. */
export const analyticsDaily = pgTable(
	'analytics_daily',
	{
		day: date('day').notNull(),
		metric: text('metric').notNull(),
		value: integer('value').notNull()
	},
	(t) => [primaryKey({ columns: [t.day, t.metric] })]
).enableRLS();

/** Used one-time tokens (challenges, PoW solutions, tickets, Turnstile). Hash only, kept until expiry. */
export const usedTokens = pgTable(
	'used_tokens',
	{
		key: text('key').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
	},
	(t) => [index('used_tokens_expiry_idx').on(t.expiresAt)]
).enableRLS();

/** Operator-granted XP (e.g. carried over from another service). Counts toward level. */
export const xpGrants = pgTable('xp_grants', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	xp: integer('xp').notNull(),
	reason: text('reason').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [index('xp_grants_user_idx').on(t.userId)]).enableRLS();

/** Last clear per data category (lib/data/categories.ts). Older browser copies are dropped. */
export const dataResets = pgTable(
	'data_resets',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		category: text('category').notNull(),
		clearedAt: timestamp('cleared_at', { withTimezone: true }).notNull()
	},
	(t) => [primaryKey({ columns: [t.userId, t.category] })]
).enableRLS();

/** Profile pictures, re-encoded in the browser and validated on the server. */
export const avatars = pgTable('avatars', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	mime: text('mime').notNull(),
	data: text('data').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	/** When the uploader confirmed they hold the rights to the image (Content and Copyright Policy). */
	rightsConfirmedAt: timestamp('rights_confirmed_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS();

/** Security-relevant account activity, shown to the user and kept for audit. */
export const securityEvents = pgTable('security_events', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	device: text('device').notNull().default(''),
	createdAt: created()
}, (t) => [index('security_events_user_idx').on(t.userId, t.createdAt)]).enableRLS();

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
