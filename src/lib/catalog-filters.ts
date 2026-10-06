import type { BusinessStatus, Category } from "@/generated/prisma/enums";

// The catalog's state (SPEC §5 S3), kept entirely in the URL so it is shareable and
// survives refresh. Pure and client-safe: server pages parse it (parse-catalog-filters.ts),
// client controls patch it and navigate to `catalogHref(...)`.

export const CATALOG_PATH = "/assets";
export const CATALOG_PAGE_SIZE = 12;
/** Largest value an `Int` price column can hold (~€2.1B). */
export const MAX_PRICE_EUR = 2_147_483_647;
/** Keyword search uses at most this many words; each adds an OR group to the query. */
export const MAX_KEYWORDS = 6;

/** `best-match` needs a buyer with a profile; for anyone else the catalog shows Newest. */
export const CATALOG_SORTS = ["newest", "price-asc", "price-desc", "best-match"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const SORT_LABELS: Record<CatalogSort, string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "best-match": "Best match",
};

export interface CatalogFilters {
  q: string | null;
  categories: Category[];
  countries: string[];
  businessStatuses: BusinessStatus[];
  licenseTypes: string[];
  regulators: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: CatalogSort;
  page: number;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: null,
  categories: [],
  countries: [],
  businessStatuses: [],
  licenseTypes: [],
  regulators: [],
  priceMin: null,
  priceMax: null,
  sort: "newest",
  page: 1,
};

/** URL keys. Short and stable: they end up in shared links. */
export const CATALOG_PARAMS = {
  q: "q",
  categories: "category",
  countries: "country",
  businessStatuses: "status",
  licenseTypes: "license",
  regulators: "regulator",
  priceMin: "priceMin",
  priceMax: "priceMax",
  sort: "sort",
  page: "page",
} as const satisfies Record<keyof CatalogFilters, string>;

/** Canonical query string: fixed key order, defaults omitted, so equal filters → equal URLs. */
export function catalogSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set(CATALOG_PARAMS.q, filters.q);
  for (const value of filters.categories) params.append(CATALOG_PARAMS.categories, value);
  for (const value of filters.countries) params.append(CATALOG_PARAMS.countries, value);
  for (const value of filters.businessStatuses) params.append(CATALOG_PARAMS.businessStatuses, value);
  for (const value of filters.licenseTypes) params.append(CATALOG_PARAMS.licenseTypes, value);
  for (const value of filters.regulators) params.append(CATALOG_PARAMS.regulators, value);
  if (filters.priceMin !== null) params.set(CATALOG_PARAMS.priceMin, String(filters.priceMin));
  if (filters.priceMax !== null) params.set(CATALOG_PARAMS.priceMax, String(filters.priceMax));
  if (filters.sort !== DEFAULT_CATALOG_FILTERS.sort) params.set(CATALOG_PARAMS.sort, filters.sort);
  if (filters.page > 1) params.set(CATALOG_PARAMS.page, String(filters.page));
  return params;
}

export function catalogHref(filters: CatalogFilters): string {
  const query = catalogSearchParams(filters).toString();
  return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
}

/**
 * A new filter object with the patch applied. Any change other than an explicit page jumps
 * back to page 1: page 3 of the old result set means nothing for the new one.
 */
export function withFilters(filters: CatalogFilters, patch: Partial<CatalogFilters>): CatalogFilters {
  return { ...filters, page: 1, ...patch };
}

/** Filters reset, sort kept: "Reset all filters" is not "reset the sort order". */
export function clearedFilters(filters: CatalogFilters): CatalogFilters {
  return { ...DEFAULT_CATALOG_FILTERS, sort: filters.sort };
}

/** The multi-value filters: `categories`, `countries`, `businessStatuses`, … */
export type ListFilterKey = {
  [K in keyof CatalogFilters]: CatalogFilters[K] extends readonly unknown[] ? K : never;
}[keyof CatalogFilters];

/** The filters with one value taken out of one multi-value filter (page back to 1). */
export function withoutValue(filters: CatalogFilters, key: ListFilterKey, value: string): CatalogFilters {
  const remaining = (filters[key] as readonly string[]).filter((v) => v !== value);
  // Safe: `remaining` is a subset of filters[key], so it keeps that key's element type.
  return withFilters(filters, { [key]: remaining } as Partial<CatalogFilters>);
}

/** Adds the value if absent, removes it if present. Returns a new array. */
export function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** Filters a user set in the side panel (category tabs and search are visible elsewhere). */
export function panelFilterCount(filters: CatalogFilters): number {
  return (
    filters.countries.length +
    filters.businessStatuses.length +
    filters.licenseTypes.length +
    filters.regulators.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0)
  );
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return filters.q !== null || filters.categories.length > 0 || panelFilterCount(filters) > 0;
}

/** Plain digits, or digits in groups of three: "500000", "500 000", "500,000", "1.500.000". */
const PRICE_INPUT = /^(\d{1,10}|\d{1,3}([ ,.'’]\d{3})+)$/;

/**
 * Whole euros typed by a person → number. Anything else (letters, decimals such as "1.5",
 * negatives, values past the Int column) → null, which means "no bound".
 */
export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!PRICE_INPUT.test(trimmed)) return null;
  const value = Number(trimmed.replace(/\D/g, ""));
  return value <= MAX_PRICE_EUR ? value : null;
}
