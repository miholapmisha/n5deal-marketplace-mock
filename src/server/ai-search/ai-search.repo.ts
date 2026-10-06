import "server-only";

import { db } from "@/server/db";

/**
 * Counts one search in the caller's window and returns the window's new total. A single
 * `INSERT … ON CONFLICT DO UPDATE`, so two searches at the same moment both count.
 */
export async function incrementSearchCount(key: string, windowStart: Date): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "AiSearchUsage" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "AiSearchUsage"."count" + 1
    RETURNING "count"`;
  return rows[0].count;
}

/** Drops the counters of every window before this one: they can no longer limit anyone. */
export async function deleteSearchCountsBefore(windowStart: Date): Promise<void> {
  await db.aiSearchUsage.deleteMany({ where: { windowStart: { lt: windowStart } } });
}
