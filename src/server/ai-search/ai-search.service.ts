import "server-only";

import { createHash } from "node:crypto";

import type { AiSearchResult } from "@/lib/ai-search";
import { DEFAULT_CATALOG_FILTERS, hasActiveFilters } from "@/lib/catalog-filters";
import { toSearchFilters } from "@/server/ai-search/ai-filters";
import { interpretQuery, isAiSearchConfigured } from "@/server/ai-search/ai-search.model";
import { deleteSearchCountsBefore, incrementSearchCount } from "@/server/ai-search/ai-search.repo";
import { listCatalogLicenseTypes } from "@/server/assets/asset.service";
import { getCurrentUser } from "@/server/auth/session";

// SPEC §7: rate limit → model → filters, with a keyword fallback at every step that can
// fail. Every outcome is an answer the catalog can show; none is an error page.

export const AI_SEARCHES_PER_HOUR = 20;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Who the limit applies to: the account when logged in (new sessions do not reset it),
 * otherwise the IP. The IP is stored hashed; the counters only need to tell callers apart.
 */
async function callerKey(clientIp: string | null): Promise<string> {
  const user = await getCurrentUser();
  if (user) return `user:${user.id}`;
  return `ip:${createHash("sha256").update(clientIp ?? "unknown").digest("hex")}`;
}

/** Counts this search; false once the caller is past the hourly limit. Fixed hour windows. */
async function takeSearchSlot(clientIp: string | null): Promise<boolean> {
  const now = Date.now();
  const windowStart = new Date(now - (now % HOUR_MS));
  const count = await incrementSearchCount(await callerKey(clientIp), windowStart);
  // A caller's first search in a window clears expired windows, so the table stays small.
  if (count === 1) await deleteSearchCountsBefore(windowStart);
  return count <= AI_SEARCHES_PER_HOUR;
}

export async function aiSearch(query: string, clientIp: string | null): Promise<AiSearchResult> {
  // Without a key there is nothing to spend, so nothing is counted.
  if (!isAiSearchConfigured()) return { mode: "keyword", reason: "unavailable" };
  if (!(await takeSearchSlot(clientIp))) return { mode: "keyword", reason: "rate-limited" };

  const interpreted = await interpretQuery(query, await listCatalogLicenseTypes());
  if (!interpreted) return { mode: "keyword", reason: "unavailable" };

  const filters = toSearchFilters(interpreted);
  return hasActiveFilters({ ...DEFAULT_CATALOG_FILTERS, ...filters })
    ? { mode: "ai", filters }
    : { mode: "keyword", reason: "no-filters" };
}
