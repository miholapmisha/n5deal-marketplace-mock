import type { AssetStatus, Category, UserStatus } from "@/generated/prisma/enums";

// The manager screens' state (SPEC §5 S10, S11), kept in the URL like the catalog's: links
// to a filtered table can be shared and survive a refresh. Pure and client-safe; the pages
// parse it (parse-manager-filters.ts), client controls patch it and navigate.

export const MANAGER_PATH = "/manager";
export const PARTICIPANTS_PATH = "/manager/users";
export const MANAGER_PAGE_SIZE = 20;
/** Keyword search uses at most this many words; each adds an OR group to the query. */
export const MAX_MANAGER_KEYWORDS = 6;

// ─── S10 assets table ────────────────────────────────────────────────────────────────────

export interface ManagerAssetFilters {
  q: string | null;
  category: Category | null;
  country: string | null;
  status: AssetStatus | null;
  /** Seller id. */
  seller: string | null;
  page: number;
}

export const DEFAULT_MANAGER_ASSET_FILTERS: ManagerAssetFilters = {
  q: null,
  category: null,
  country: null,
  status: null,
  seller: null,
  page: 1,
};

/** Canonical query string: fixed key order, defaults omitted, so equal filters → equal URLs. */
export function managerAssetsHref(filters: ManagerAssetFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.country) params.set("country", filters.country);
  if (filters.status) params.set("status", filters.status);
  if (filters.seller) params.set("seller", filters.seller);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${MANAGER_PATH}?${query}` : MANAGER_PATH;
}

export function hasManagerAssetFilters(filters: ManagerAssetFilters): boolean {
  return Boolean(filters.q || filters.category || filters.country || filters.status || filters.seller);
}

// ─── S11 participants ────────────────────────────────────────────────────────────────────

/** The two tabs. Managers are never listed: they cannot be moderated. */
export type ParticipantRole = "BUYER" | "SELLER";

export interface ParticipantFilters {
  role: ParticipantRole;
  q: string | null;
  status: UserStatus | null;
  page: number;
}

export const DEFAULT_PARTICIPANT_FILTERS: ParticipantFilters = {
  role: "BUYER",
  q: null,
  status: null,
  page: 1,
};

export function participantsHref(filters: ParticipantFilters): string {
  const params = new URLSearchParams();
  if (filters.role !== DEFAULT_PARTICIPANT_FILTERS.role) params.set("role", filters.role.toLowerCase());
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status.toLowerCase());
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${PARTICIPANTS_PATH}?${query}` : PARTICIPANTS_PATH;
}

export function hasParticipantFilters(filters: ParticipantFilters): boolean {
  return Boolean(filters.q || filters.status);
}
