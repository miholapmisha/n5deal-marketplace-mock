import type { AssetStatus, Category, UserStatus } from "@/generated/prisma/enums";

export const MANAGER_PATH = "/manager";
export const PARTICIPANTS_PATH = "/manager/users";
export const MANAGER_PAGE_SIZE = 20;
export const MAX_MANAGER_KEYWORDS = 6;

export interface ManagerAssetFilters {
  q: string | null;
  category: Category | null;
  country: string | null;
  status: AssetStatus | null;
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
