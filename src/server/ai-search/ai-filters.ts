import "server-only";

import { type SearchFilters, searchFiltersOf } from "@/lib/ai-search";
import { CATALOG_PARAMS } from "@/lib/catalog-filters";
import { parseCatalogFilters } from "@/lib/parse-catalog-filters";
import { regionCountries } from "@/lib/regions";
import type { AiFilters } from "@/server/ai-search/ai-search.schema";

export function toSearchFilters(ai: AiFilters): SearchFilters {
  const countries = [...regionCountries(ai.regions ?? []), ...(ai.countries ?? [])];

  return searchFiltersOf(
    parseCatalogFilters({
      [CATALOG_PARAMS.q]: ai.keywords,
      [CATALOG_PARAMS.categories]: ai.categories,
      [CATALOG_PARAMS.countries]: countries,
      [CATALOG_PARAMS.businessStatuses]: ai.businessStatus,
      [CATALOG_PARAMS.licenseTypes]: ai.licenseTypes,
      [CATALOG_PARAMS.priceMin]: ai.priceMinEur?.toString(),
      [CATALOG_PARAMS.priceMax]: ai.priceMaxEur?.toString(),
    }),
  );
}
