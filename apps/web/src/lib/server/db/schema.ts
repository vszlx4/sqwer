import { boolean, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { FingerObservation } from '@sqwer/fingermap';

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
	lockedUntil: timestamp('locked_until', { withTimezone: true })
});

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
});

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
});

export const recoveryCodes = pgTable('recovery_codes', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	codeHash: text('code_hash').notNull(),
	usedAt: timestamp('used_at', { withTimezone: true })
});

export const fingerMaps = pgTable('finger_maps', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	observations: jsonb('observations').$type<FingerObservation[]>().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/** Saved test and assessment results. `data` holds the full result record. */
export const results = pgTable('results', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	exam: text('exam').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	data: jsonb('data').notNull()
});

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
);

/** Profile pictures, re-encoded in the browser and validated on the server. */
export const avatars = pgTable('avatars', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	mime: text('mime').notNull(),
	data: text('data').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

/** Security-relevant account activity, shown to the user and kept for audit. */
export const securityEvents = pgTable('security_events', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	device: text('device').notNull().default(''),
	createdAt: created()
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
