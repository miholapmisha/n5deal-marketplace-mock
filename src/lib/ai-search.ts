import type { CatalogFilters } from "@/lib/catalog-filters";

export const AI_SEARCH_ENDPOINT = "/api/ai-search";

export const MAX_AI_QUERY_LENGTH = 200;

export type SearchFilters = Omit<CatalogFilters, "sort" | "page">;

export type FallbackReason = "unavailable" | "no-filters" | "rate-limited";

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
