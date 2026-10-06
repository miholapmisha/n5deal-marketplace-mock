import "server-only";

import type { AssetStatus, BuyerType, ModerationAction, Role, UserStatus } from "@/generated/prisma/client";
import { countryName } from "@/lib/format";
import {
  MANAGER_PAGE_SIZE,
  type ManagerAssetFilters,
  type ParticipantFilters,
  type ParticipantRole,
} from "@/lib/manager-filters";
import type { AssetModeration, UserModeration } from "@/lib/moderation";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
import {
  changeAssetStatus,
  changeUserStatus,
  countAssetsBySellerAndStatus,
  countAssetStats,
  countManagerAssets,
  countParticipantsByRole,
  countUsersByRoleAndStatus,
  findAssetCountries,
  findAssetForModeration,
  findManagerAssets,
  findParticipants,
  findRecentModerationLogs,
  findSellers,
  findUserForModeration,
  removeUser,
} from "@/server/moderation/moderation.repo";
import type { ModerateAssetInput, ModerateUserInput } from "@/server/moderation/moderation.schema";
import { participantName } from "@/server/policies/conversation-rules";
import {
  ASSET_TRANSITIONS,
  assetActionsFor,
  removalConfirmation,
  USER_TRANSITIONS,
  userActionsFor,
  userModerationBlock,
} from "@/server/policies/moderation-rules";

// SPEC §4.3, §5 S10–S11. Every function checks that the viewer is a manager itself: pages
// also call requireRole(), but the service is the one place the rule cannot be skipped.

const SESSION_EXPIRED = "Your session has expired. Log in again.";
const MANAGERS_ONLY = "Only platform managers can moderate.";
const CHANGED = "This changed in the meantime. Refresh the page and try again.";
const RECENT_LOG_ENTRIES = 20;

async function currentManager(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "MANAGER" ? user : null;
}

function pageCountFor(total: number): number {
  return Math.max(1, Math.ceil(total / MANAGER_PAGE_SIZE));
}

const skipFor = (page: number) => (page - 1) * MANAGER_PAGE_SIZE;

/** A page past the end (stale link) is clamped to the last one, at the cost of a refetch. */
async function clampedPage<T>(
  requested: number,
  total: number,
  requestedRows: T[],
  fetchPage: (page: number) => Promise<T[]>,
): Promise<{ page: number; rows: T[] }> {
  const page = Math.min(requested, pageCountFor(total));
  return { page, rows: page === requested ? requestedRows : await fetchPage(page) };
}

export interface FilterOption {
  value: string;
  label: string;
}

// ─── Overview (S10) ──────────────────────────────────────────────────────────────────────

export interface OverviewStats {
  /** Buyer and seller accounts that are not removed. */
  buyers: number;
  sellers: number;
  /** Published assets of active sellers: what the public catalog shows. */
  liveAssets: number;
  hiddenAssets: number;
  suspendedUsers: number;
}

export async function getOverviewStats(): Promise<OverviewStats | null> {
  if (!(await currentManager())) return null;
  const [users, assets] = await Promise.all([countUsersByRoleAndStatus(), countAssetStats()]);
  const sum = (match: (group: { role: Role; status: UserStatus }) => boolean) =>
    users.filter(match).reduce((total, group) => total + group.count, 0);

  return {
    buyers: sum((group) => group.role === "BUYER" && group.status !== "REMOVED"),
    sellers: sum((group) => group.role === "SELLER" && group.status !== "REMOVED"),
    liveAssets: assets.live,
    hiddenAssets: assets.hidden,
    suspendedUsers: sum((group) => group.status === "SUSPENDED"),
  };
}

export interface ManagerAssetFilterOptions {
  countries: FilterOption[];
  sellers: FilterOption[];
}

const byLabel = (a: FilterOption, b: FilterOption) => a.label.localeCompare(b.label, "en");

/**
 * Countries that occur on any asset (plus a selected one that no longer does, so a stale
 * link's filter can still be seen and cleared) and every seller account.
 */
export async function getManagerAssetFilterOptions(selectedCountry: string | null): Promise<ManagerAssetFilterOptions> {
  if (!(await currentManager())) return { countries: [], sellers: [] };
  const [countries, sellers] = await Promise.all([findAssetCountries(), findSellers()]);
  const countryCodes = [...new Set(selectedCountry ? [...countries, selectedCountry] : countries)];

  return {
    countries: countryCodes.map((code) => ({ value: code, label: countryName(code) })).sort(byLabel),
    sellers: sellers.map((seller) => ({
      value: seller.id,
      label:
        seller.status === "ACTIVE"
          ? participantName(seller)
          : `${participantName(seller)} (${seller.status.toLowerCase()})`,
    })),
  };
}

type ManagerAssetRecord = Awaited<ReturnType<typeof findManagerAssets>>[number];

export interface ManagerAssetRow extends Omit<ManagerAssetRecord, "seller"> {
  seller: { id: string; displayName: string; status: UserStatus };
  /** The moderation actions that apply to the asset's current status. */
  actions: AssetModeration[];
}

export interface ManagerAssetPage {
  assets: ManagerAssetRow[];
  total: number;
  page: number;
  pageCount: number;
}

function toAssetRow({ seller, ...asset }: ManagerAssetRecord): ManagerAssetRow {
  return {
    ...asset,
    seller: { id: seller.id, displayName: participantName(seller), status: seller.status },
    actions: assetActionsFor(asset.status),
  };
}

/** S10 assets table: every status, newest first, one page. */
export async function listManagerAssets(filters: ManagerAssetFilters): Promise<ManagerAssetPage | null> {
  if (!(await currentManager())) return null;
  const fetchPage = (page: number) => findManagerAssets(filters, skipFor(page), MANAGER_PAGE_SIZE);
  const [total, requestedRows] = await Promise.all([countManagerAssets(filters), fetchPage(filters.page)]);
  const { page, rows } = await clampedPage(filters.page, total, requestedRows, fetchPage);
  return { assets: rows.map(toAssetRow), total, page, pageCount: pageCountFor(total) };
}

export type ModerationTarget =
  | { kind: "user"; label: string; role: Role }
  | { kind: "asset"; label: string; slug: string };

export interface ModerationLogEntry {
  id: string;
  action: ModerationAction;
  reason: string;
  createdAt: Date;
  managerName: string;
  /** Null only if a row was written without a target, which the service never does. */
  target: ModerationTarget | null;
}

/** S10: the newest log entries. Removed users appear as "Removed user". */
export async function listRecentModeration(): Promise<ModerationLogEntry[]> {
  if (!(await currentManager())) return [];
  const rows = await findRecentModerationLogs(RECENT_LOG_ENTRIES);
  return rows.map(({ manager, targetUser, targetAsset, ...entry }) => ({
    ...entry,
    managerName: manager.name,
    target: targetUser
      ? { kind: "user", label: participantName(targetUser), role: targetUser.role }
      : targetAsset
        ? { kind: "asset", label: targetAsset.title, slug: targetAsset.slug }
        : null,
  }));
}

// ─── Participants (S11) ──────────────────────────────────────────────────────────────────

export type ParticipantSummary =
  | {
      kind: "buyer";
      profile: { buyerType: BuyerType; ticketMinEur: number | null; ticketMaxEur: number | null; isVisible: boolean } | null;
    }
  | { kind: "seller"; assets: Partial<Record<AssetStatus, number>> };

export interface ParticipantRow {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  status: UserStatus;
  statusReason: string | null;
  createdAt: Date;
  conversations: number;
  summary: ParticipantSummary;
  actions: UserModeration[];
  /** What the manager must type to confirm a removal. */
  removalConfirmation: string;
}

export interface ParticipantPage {
  participants: ParticipantRow[];
  total: number;
  page: number;
  pageCount: number;
  /** Matches per tab, with the search and status filter applied. */
  counts: Record<ParticipantRole, number>;
}

type ParticipantRecord = Awaited<ReturnType<typeof findParticipants>>[number];

function assetCountsBySeller(rows: Awaited<ReturnType<typeof countAssetsBySellerAndStatus>>) {
  return rows.reduce(
    (bySeller, row) => bySeller.set(row.sellerId, { ...bySeller.get(row.sellerId), [row.status]: row.count }),
    new Map<string, Partial<Record<AssetStatus, number>>>(),
  );
}

function toParticipantRow(
  { buyerProfile, _count, role, ...user }: ParticipantRecord,
  assetCounts: Map<string, Partial<Record<AssetStatus, number>>>,
): ParticipantRow {
  const isBuyer = role === "BUYER";
  return {
    ...user,
    conversations: isBuyer ? _count.buyerConversations : _count.sellerConversations,
    summary: isBuyer
      ? { kind: "buyer", profile: buyerProfile }
      : { kind: "seller", assets: assetCounts.get(user.id) ?? {} },
    actions: userActionsFor(user.status),
    removalConfirmation: removalConfirmation(user),
  };
}

/** S11: buyers or sellers (never managers), newest accounts first, one page. */
export async function listParticipants(filters: ParticipantFilters): Promise<ParticipantPage | null> {
  if (!(await currentManager())) return null;
  const fetchPage = (page: number) => findParticipants(filters, skipFor(page), MANAGER_PAGE_SIZE);
  const [groups, requestedRows] = await Promise.all([countParticipantsByRole(filters), fetchPage(filters.page)]);
  const counts: Record<ParticipantRole, number> = {
    BUYER: groups.find((group) => group.role === "BUYER")?.count ?? 0,
    SELLER: groups.find((group) => group.role === "SELLER")?.count ?? 0,
  };
  const total = counts[filters.role];
  const { page, rows } = await clampedPage(filters.page, total, requestedRows, fetchPage);
  const assetCounts = assetCountsBySeller(
    filters.role === "SELLER" ? await countAssetsBySellerAndStatus(rows.map((row) => row.id)) : [],
  );

  return {
    participants: rows.map((row) => toParticipantRow(row, assetCounts)),
    total,
    page,
    pageCount: pageCountFor(total),
    counts,
  };
}

// ─── Moderation actions ──────────────────────────────────────────────────────────────────

export type ModerationResult = { ok: true } | { ok: false; error: string; field?: "confirmation" };

async function managerOrError(): Promise<{ manager: CurrentUser } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  if (user.role !== "MANAGER") return { ok: false, error: MANAGERS_ONLY };
  return { manager: user };
}

/** Suspend, reinstate, or remove a buyer or seller (SPEC §4.3). */
export async function moderateUser(input: ModerateUserInput): Promise<ModerationResult> {
  const check = await managerOrError();
  if (!("manager" in check)) return check;
  const { manager } = check;

  const target = await findUserForModeration(input.userId);
  if (!target) return { ok: false, error: "This account no longer exists." };
  const blocked = userModerationBlock(manager, target);
  if (blocked) return { ok: false, error: blocked };
  const transition = USER_TRANSITIONS[input.action];
  if (!transition.from.includes(target.status)) return { ok: false, error: transition.refusal };

  const change = { managerId: manager.id, userId: target.id, expected: target.status, reason: input.reason };
  if (input.action === "REMOVE_USER") {
    if (input.confirmation !== removalConfirmation(target)) {
      return { ok: false, error: "The name you typed does not match.", field: "confirmation" };
    }
    return (await removeUser(change)) ? { ok: true } : { ok: false, error: CHANGED };
  }
  const changed = await changeUserStatus({ ...change, action: input.action, next: transition.to });
  return changed ? { ok: true } : { ok: false, error: CHANGED };
}

/** Hide, unhide, or remove any asset (SPEC §4.3). Visibility for buyers follows at query time. */
export async function moderateAsset(input: ModerateAssetInput): Promise<ModerationResult> {
  const check = await managerOrError();
  if (!("manager" in check)) return check;

  const asset = await findAssetForModeration(input.assetId);
  if (!asset) return { ok: false, error: "This asset no longer exists." };
  const transition = ASSET_TRANSITIONS[input.action];
  if (!transition.from.includes(asset.status)) return { ok: false, error: transition.refusal };

  // Unhiding restores the listing where it was: the original publish date, no reason.
  const data =
    input.action === "UNHIDE_ASSET"
      ? { status: transition.to, statusReason: null, publishedAt: asset.publishedAt ?? new Date() }
      : { status: transition.to, statusReason: input.reason };
  const changed = await changeAssetStatus({
    managerId: check.manager.id,
    assetId: asset.id,
    action: input.action,
    expected: asset.status,
    data,
    reason: input.reason,
  });
  return changed ? { ok: true } : { ok: false, error: CHANGED };
}
