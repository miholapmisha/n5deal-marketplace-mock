import "server-only";

import { db } from "@/server/db";

export async function incrementSearchCount(key: string, windowStart: Date): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "AiSearchUsage" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "AiSearchUsage"."count" + 1
    RETURNING "count"`;
  return rows[0].count;
}

export async function deleteSearchCountsBefore(windowStart: Date): Promise<void> {
  await db.aiSearchUsage.deleteMany({ where: { windowStart: { lt: windowStart } } });
}
