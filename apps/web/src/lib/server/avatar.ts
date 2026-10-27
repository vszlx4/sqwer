import { eq } from 'drizzle-orm';
import { db, schema } from './db/index.ts';

export const MAX_AVATAR_BYTES = 1024 * 1024;

const SIGNATURES: { mime: string; test: (b: Uint8Array) => boolean }[] = [
	{ mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
	{ mime: 'image/png', test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v) },
	{
		mime: 'image/webp',
		test: (b) =>
			String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === 'RIFF' && String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!) === 'WEBP'
	}
];

/** PNG, JPEG or WebP only, detected from the bytes. */
export async function validateAvatar(file: File): Promise<{ mime: string; bytes: Uint8Array } | { error: string }> {
	if (!file.size) return { error: 'Select an image to upload.' };
	if (file.size > MAX_AVATAR_BYTES) return { error: 'The image must be 1 MB or smaller.' };
	const bytes = new Uint8Array(await file.arrayBuffer());
	const match = SIGNATURES.find((s) => s.test(bytes));
	if (!match) return { error: 'Upload a PNG, JPEG or WebP image.' };
	return { mime: match.mime, bytes };
}

/** Saves a picture with the uploader's rights confirmation time. */
export async function saveAvatar(userId: string, mime: string, bytes: Uint8Array) {
	const data = Buffer.from(bytes).toString('base64');
	const now = new Date();
	await (await db())
		.insert(schema.avatars)
		.values({ userId, mime, data, updatedAt: now, rightsConfirmedAt: now })
		.onConflictDoUpdate({ target: schema.avatars.userId, set: { mime, data, updatedAt: now, rightsConfirmedAt: now } });
}

export async function deleteAvatar(userId: string) {
	await (await db()).delete(schema.avatars).where(eq(schema.avatars.userId, userId));
}

/** Versioned URL for a user's picture, or null when none is set. */
export async function avatarUrl(userId: string): Promise<string | null> {
	const rows = await (await db())
		.select({ updatedAt: schema.avatars.updatedAt })
		.from(schema.avatars)
		.where(eq(schema.avatars.userId, userId))
		.limit(1);
	return rows[0] ? `/avatars/${userId}?v=${rows[0].updatedAt.getTime()}` : null;
}
