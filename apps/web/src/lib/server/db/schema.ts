import { boolean, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { FingerObservation } from '@sqwer/fingermap';

/*
 * Row-level security is enabled on every table with no policies, so nothing can be read or
 * written through a hosted provider's automatic data API. sqwer connects as the table owner,
 * which row-level security does not restrict.
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
	ageConfirmedAt: timestamp('age_confirmed_at', { withTimezone: true })
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
	device: text('device').notNull().default('')
}).enableRLS();

export const recoveryCodes = pgTable('recovery_codes', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	codeHash: text('code_hash').notNull(),
	usedAt: timestamp('used_at', { withTimezone: true })
}).enableRLS();

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
	data: jsonb('data').notNull()
}).enableRLS();

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
}).enableRLS();

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
