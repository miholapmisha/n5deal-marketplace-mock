import { z } from "zod";

import { BusinessStatus, Category } from "@/generated/prisma/enums";
import {
  CATALOG_PARAMS,
  CATALOG_SORTS,
  type CatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  MAX_KEYWORDS,
} from "@/lib/catalog-filters";
import {
  countrySchema,
  enumValueSchema,
  NO_CONTROL_CHARS,
  pageSchema,
  parseEuroRange,
  parseMany,
  parseOne,
  type RawSearchParams,
  searchQuerySchema,
} from "@/lib/search-params";

// URL → CatalogFilters (SPEC §6.6, §9). Kept apart from catalog-filters.ts so Zod stays out
// of the client bundle.

const MAX_TEXT_VALUE_LENGTH = 80;

const categorySchema = enumValueSchema(Category);
const businessStatusSchema = enumValueSchema(BusinessStatus);
/** License types and regulators are free text in the data ("Banking (CRR)", "PRA / FCA"). */
const textValueSchema = z.string().trim().min(1).max(MAX_TEXT_VALUE_LENGTH).regex(NO_CONTROL_CHARS);
const sortSchema = z.enum(CATALOG_SORTS);
const querySchema = searchQuerySchema(MAX_KEYWORDS);

export function parseCatalogFilters(raw: RawSearchParams): CatalogFilters {
  const [priceMin, priceMax] = parseEuroRange(raw, CATALOG_PARAMS.priceMin, CATALOG_PARAMS.priceMax);

  return {
    q: parseOne(raw, CATALOG_PARAMS.q, querySchema),
    categories: parseMany(raw, CATALOG_PARAMS.categories, categorySchema),
    countries: parseMany(raw, CATALOG_PARAMS.countries, countrySchema),
    businessStatuses: parseMany(raw, CATALOG_PARAMS.businessStatuses, businessStatusSchema),
    licenseTypes: parseMany(raw, CATALOG_PARAMS.licenseTypes, textValueSchema),
    regulators: parseMany(raw, CATALOG_PARAMS.regulators, textValueSchema),
    priceMin,
    priceMax,
    sort: parseOne(raw, CATALOG_PARAMS.sort, sortSchema) ?? DEFAULT_CATALOG_FILTERS.sort,
    page: parseOne(raw, CATALOG_PARAMS.page, pageSchema) ?? DEFAULT_CATALOG_FILTERS.page,
  };
}
