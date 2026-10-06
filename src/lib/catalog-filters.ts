import type { BusinessStatus, Category } from "@/generated/prisma/enums";

export const CATALOG_PATH = "/assets";
export const CATALOG_PAGE_SIZE = 12;
export const MAX_PRICE_EUR = 2_147_483_647;
export const MAX_KEYWORDS = 6;

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

export function withFilters(filters: CatalogFilters, patch: Partial<CatalogFilters>): CatalogFilters {
  return { ...filters, page: 1, ...patch };
}

export function clearedFilters(filters: CatalogFilters): CatalogFilters {
  return { ...DEFAULT_CATALOG_FILTERS, sort: filters.sort };
}

export type ListFilterKey = {
  [K in keyof CatalogFilters]: CatalogFilters[K] extends readonly unknown[] ? K : never;
}[keyof CatalogFilters];

export function withoutValue(filters: CatalogFilters, key: ListFilterKey, value: string): CatalogFilters {
  const remaining = (filters[key] as readonly string[]).filter((v) => v !== value);
  return withFilters(filters, { [key]: remaining } as Partial<CatalogFilters>);
}

export function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

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

const PRICE_INPUT = /^(\d{1,10}|\d{1,3}([ ,.'’]\d{3})+)$/;

export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!PRICE_INPUT.test(trimmed)) return null;
  const value = Number(trimmed.replace(/\D/g, ""));
  return value <= MAX_PRICE_EUR ? value : null;
}
