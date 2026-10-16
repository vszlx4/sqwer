import { eq } from "drizzle-orm";
import { SITE_URL } from "#lib/server/config.ts";
import { avatarUrl } from "#lib/server/avatar.ts";
import { db, schema } from "#lib/server/db/index.ts";
import {
  accountLevel,
  competitiveBest,
  paceSummary,
} from "#lib/server/progress.ts";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  depends("app:user");
  if (!locals.user) return { user: null, siteUrl: SITE_URL };
  const [rows, level, best, pace, avatar] = await Promise.all([
    (await db())
      .select({
        username: schema.profiles.username,
        displayName: schema.profiles.displayName,
        avatarColor: schema.profiles.avatarColor,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, locals.user.id))
      .limit(1),
    accountLevel(locals.user.id),
    competitiveBest(locals.user.id),
    paceSummary(locals.user.id),
    avatarUrl(locals.user.id),
  ]);
  return {
    user: {
      email: locals.user.email,
      profile: rows[0] ?? null,
      avatar,
      level,
      best,
      pace,
    },
    siteUrl: SITE_URL,
  };
};
