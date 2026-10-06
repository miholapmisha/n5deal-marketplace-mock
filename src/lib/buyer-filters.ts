import type { BuyerType, Category } from "@/generated/prisma/enums";

// The buyer directory's state (SPEC §5 S8), kept in the URL like the catalog's. Pure and
// client-safe: the page parses it (parse-buyer-filters.ts), client controls patch it and
// navigate to `buyersHref(...)`.

export const BUYERS_PATH = "/buyers";
export const BUYERS_PAGE_SIZE = 12;
/** Keyword search uses at most this many words; each adds an OR group to the query. */
export const MAX_BUYER_KEYWORDS = 6;

export interface BuyerFilters {
  q: string | null;
  categories: Category[];
  countries: string[];
  buyerTypes: BuyerType[];
  ticketMin: number | null;
  ticketMax: number | null;
  /** "Rank for": one of the viewing seller's published assets, by id. */
  rank: string | null;
  page: number;
}

export const DEFAULT_BUYER_FILTERS: BuyerFilters = {
  q: null,
  categories: [],
  countries: [],
  buyerTypes: [],
  ticketMin: null,
  ticketMax: null,
  rank: null,
  page: 1,
};

/** URL keys. Short and stable: they end up in shared links. */
export const BUYER_PARAMS = {
  q: "q",
  categories: "category",
  countries: "country",
  buyerTypes: "type",
  ticketMin: "ticketMin",
  ticketMax: "ticketMax",
  rank: "rank",
  page: "page",
} as const satisfies Record<keyof BuyerFilters, string>;

/** Canonical query string: fixed key order, defaults omitted, so equal filters → equal URLs. */
export function buyerSearchParams(filters: BuyerFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set(BUYER_PARAMS.q, filters.q);
  for (const value of filters.categories) params.append(BUYER_PARAMS.categories, value);
  for (const value of filters.countries) params.append(BUYER_PARAMS.countries, value);
  for (const value of filters.buyerTypes) params.append(BUYER_PARAMS.buyerTypes, value);
  if (filters.ticketMin !== null) params.set(BUYER_PARAMS.ticketMin, String(filters.ticketMin));
  if (filters.ticketMax !== null) params.set(BUYER_PARAMS.ticketMax, String(filters.ticketMax));
  if (filters.rank) params.set(BUYER_PARAMS.rank, filters.rank);
  if (filters.page > 1) params.set(BUYER_PARAMS.page, String(filters.page));
  return params;
}

export function buyersHref(filters: BuyerFilters): string {
  const query = buyerSearchParams(filters).toString();
  return query ? `${BUYERS_PATH}?${query}` : BUYERS_PATH;
}

/** A new filter object with the patch applied; any change but an explicit page → page 1. */
export function withBuyerFilters(filters: BuyerFilters, patch: Partial<BuyerFilters>): BuyerFilters {
  return { ...filters, page: 1, ...patch };
}

/** Filters reset, ranking kept: "Reset all filters" is not "stop ranking". */
export function clearedBuyerFilters(filters: BuyerFilters): BuyerFilters {
  return { ...DEFAULT_BUYER_FILTERS, rank: filters.rank };
}

/** Filters a user set in the side panel (search is visible above the results). */
export function buyerPanelFilterCount(filters: BuyerFilters): number {
  return (
    filters.categories.length +
    filters.countries.length +
    filters.buyerTypes.length +
    (filters.ticketMin !== null || filters.ticketMax !== null ? 1 : 0)
  );
}

export function hasActiveBuyerFilters(filters: BuyerFilters): boolean {
  return filters.q !== null || buyerPanelFilterCount(filters) > 0;
}

/** S9, optionally with the asset to talk about preselected in the contact form. */
export function buyerDetailPath(buyerId: string, assetId?: string | null): string {
  const path = `${BUYERS_PATH}/${encodeURIComponent(buyerId)}`;
  return assetId ? `${path}?asset=${encodeURIComponent(assetId)}` : path;
}
