import "server-only";

import { createHash } from "node:crypto";

import type { AiSearchResult } from "@/lib/ai-search";
import { DEFAULT_CATALOG_FILTERS, hasActiveFilters } from "@/lib/catalog-filters";
import { toSearchFilters } from "@/server/ai-search/ai-filters";
import { interpretQuery, isAiSearchConfigured } from "@/server/ai-search/ai-search.model";
import { deleteSearchCountsBefore, incrementSearchCount } from "@/server/ai-search/ai-search.repo";
import { listCatalogLicenseTypes } from "@/server/assets/asset.service";
import { getCurrentUser } from "@/server/auth/session";

export const AI_SEARCHES_PER_HOUR = 20;

const HOUR_MS = 60 * 60 * 1000;

async function callerKey(clientIp: string | null): Promise<string> {
  const user = await getCurrentUser();
  if (user) return `user:${user.id}`;
  return `ip:${createHash("sha256").update(clientIp ?? "unknown").digest("hex")}`;
}

async function takeSearchSlot(clientIp: string | null): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(now - (now % HOUR_MS));
  const count = await incrementSearchCount(await callerKey(clientIp), windowStart);
  if (count === 1) await deleteSearchCountsBefore(windowStart);
  return count <= AI_SEARCHES_PER_HOUR;
}

export async function aiSearch(query: string, clientIp: string | null): Promise<AiSearchResult> {
  if (!isAiSearchConfigured()) return { mode: "keyword", reason: "unavailable" };
  if (!(await takeSearchSlot(clientIp))) return { mode: "keyword", reason: "rate-limited" };

  const interpreted = await interpretQuery(query, await listCatalogLicenseTypes());
  if (!interpreted) return { mode: "keyword", reason: "unavailable" };

  const filters = toSearchFilters(interpreted);
  return hasActiveFilters({ ...DEFAULT_CATALOG_FILTERS, ...filters })
    ? { mode: "ai", filters }
    : { mode: "keyword", reason: "no-filters" };
}
