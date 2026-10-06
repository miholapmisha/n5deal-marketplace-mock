import type { CatalogFilters } from "@/lib/catalog-filters";

// AI search (SPEC §7) as both sides of POST /api/ai-search see it. Pure and client-safe.

export const AI_SEARCH_ENDPOINT = "/api/ai-search";

/** A sentence, not a few keywords, so longer than the keyword search box allows. */
export const MAX_AI_QUERY_LENGTH = 200;

/** What a search sets: every filter. Sort and page belong to the page, not to the search. */
export type SearchFilters = Omit<CatalogFilters, "sort" | "page">;

export type FallbackReason = "unavailable" | "no-filters" | "rate-limited";

/** Filters to apply, or why the client should run the text as a keyword search instead. */
export type AiSearchResult = { mode: "ai"; filters: SearchFilters } | { mode: "keyword"; reason: FallbackReason };

export const FALLBACK_NOTICES: Record<FallbackReason, string> = {
  unavailable: "AI search unavailable — showing keyword results",
  "no-filters": "AI search couldn't turn that into filters — showing keyword results",
  "rate-limited": "AI search limit reached (20 per hour) — showing keyword results",
};

export function searchFiltersOf(filters: CatalogFilters): SearchFilters {
  const { q, categories, countries, businessStatuses, licenseTypes, regulators, priceMin, priceMax } = filters;
  return { q, categories, countries, businessStatuses, licenseTypes, regulators, priceMin, priceMax };
}
