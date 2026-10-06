import "server-only";

import type { AssetStatus, Prisma, Role, UserStatus } from "@/generated/prisma/client";
import type { AssetModeration, UserModeration } from "@/lib/moderation";
import {
  type ManagerAssetFilters,
  MAX_MANAGER_KEYWORDS,
  type ParticipantFilters,
  type ParticipantRole,
} from "@/lib/manager-filters";
import { db } from "@/server/db";
import { publicAssetWhere } from "@/server/policies/asset-visibility";
import { REMOVED_USER_NAME } from "@/server/policies/conversation-rules";
import { containsWord, searchWords } from "@/server/text-search";

// ─── Overview stats (S10) ────────────────────────────────────────────────────────────────

/** Users per role and status: one GROUP BY instead of a COUNT per stat card. */
export async function countUsersByRoleAndStatus(): Promise<{ role: Role; status: UserStatus; count: number }[]> {
  const groups = await db.user.groupBy({ by: ["role", "status"], _count: { _all: true } });
  return groups.map((group) => ({ role: group.role, status: group.status, count: group._count._all }));
}

export async function countAssetStats(): Promise<{ live: number; hidden: number }> {
  const [live, hidden] = await Promise.all([
    db.asset.count({ where: publicAssetWhere }),
    db.asset.count({ where: { status: "HIDDEN" } }),
  ]);
  return { live, hidden };
}

// ─── Assets table (S10) ──────────────────────────────────────────────────────────────────

const managerAssetSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  country: true,
  priceEur: true,
  status: true,
  statusReason: true,
  publishedAt: true,
  seller: { select: { id: true, name: true, companyName: true, status: true } },
} as const satisfies Prisma.AssetSelect;

/** Every status (SPEC §4.1 manager view), narrowed by the filters. */
function managerAssetWhere(filters: ManagerAssetFilters): Prisma.AssetWhereInput {
  const conditions: Prisma.AssetWhereInput[] = [];
  if (filters.q) {
    conditions.push(...searchWords(filters.q, MAX_MANAGER_KEYWORDS).map((word) => ({ title: containsWord(word) })));
  }
  if (filters.category) conditions.push({ category: filters.category });
  if (filters.country) conditions.push({ country: filters.country });
  if (filters.status) conditions.push({ status: filters.status });
  if (filters.seller) conditions.push({ sellerId: filters.seller });
  return { AND: conditions };
}

/** Newest listings first; `id` keeps pagination stable when two share a timestamp. */
const MANAGER_ASSET_ORDER: Prisma.AssetOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "asc" }];

export async function findManagerAssets(filters: ManagerAssetFilters, skip: number, take: number) {
  return db.asset.findMany({
    where: managerAssetWhere(filters),
    select: managerAssetSelect,
    orderBy: MANAGER_ASSET_ORDER,
    skip,
    take,
  });
}

export async function countManagerAssets(filters: ManagerAssetFilters): Promise<number> {
  return db.asset.count({ where: managerAssetWhere(filters) });
}

/** Countries that occur on any asset, for the country filter. */
export async function findAssetCountries(): Promise<string[]> {
  const groups = await db.asset.groupBy({ by: ["country"] });
  return groups.map((group) => group.country);
}

/** Every seller account, for the seller filter. A few dozen rows in this prototype. */
export async function findSellers() {
  return db.user.findMany({
    where: { role: "SELLER" },
    select: { id: true, name: true, companyName: true, status: true },
    orderBy: [{ companyName: { sort: "asc", nulls: "last" } }, { name: "asc" }, { id: "asc" }],
  });
}

// ─── Moderation log (S10) ────────────────────────────────────────────────────────────────

export async function findRecentModerationLogs(take: number) {
  return db.moderationLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      action: true,
      reason: true,
      createdAt: true,
      manager: { select: { name: true } },
      targetUser: { select: { id: true, name: true, companyName: true, role: true, status: true } },
      targetAsset: { select: { title: true, slug: true } },
    },
  });
}

// ─── Participants (S11) ──────────────────────────────────────────────────────────────────

const participantSelect = {
  id: true,
  name: true,
  companyName: true,
  email: true,
  role: true,
  status: true,
  statusReason: true,
  createdAt: true,
  buyerProfile: { select: { buyerType: true, ticketMinEur: true, ticketMaxEur: true, isVisible: true } },
  _count: { select: { buyerConversations: true, sellerConversations: true } },
} as const satisfies Prisma.UserSelect;

/** Every word must appear in the name, the email, or the company. */
function participantSearchWhere(filters: ParticipantFilters): Prisma.UserWhereInput[] {
  const words = filters.q ? searchWords(filters.q, MAX_MANAGER_KEYWORDS) : [];
  const conditions: Prisma.UserWhereInput[] = words.map((word) => {
    const contains = containsWord(word);
    return { OR: [{ name: contains }, { email: contains }, { companyName: contains }] };
  });
  if (filters.status) conditions.push({ status: filters.status });
  return conditions;
}

const PARTICIPANT_ORDER: Prisma.UserOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "asc" }];

export async function findParticipants(filters: ParticipantFilters, skip: number, take: number) {
  return db.user.findMany({
    where: { AND: [{ role: filters.role }, ...participantSearchWhere(filters)] },
    select: participantSelect,
    orderBy: PARTICIPANT_ORDER,
    skip,
    take,
  });
}

/** Matches per tab (search and status applied, role ignored): the tab counts. */
export async function countParticipantsByRole(
  filters: ParticipantFilters,
): Promise<{ role: ParticipantRole; count: number }[]> {
  const groups = await db.user.groupBy({
    by: ["role"],
    where: { AND: [{ role: { in: ["BUYER", "SELLER"] } }, ...participantSearchWhere(filters)] },
    _count: { _all: true },
  });
  return groups.flatMap((group) =>
    group.role === "MANAGER" ? [] : [{ role: group.role, count: group._count._all }],
  );
}

/** Assets per seller and status, for the sellers shown on one page. */
export async function countAssetsBySellerAndStatus(
  sellerIds: string[],
): Promise<{ sellerId: string; status: AssetStatus; count: number }[]> {
  if (sellerIds.length === 0) return [];
  const groups = await db.asset.groupBy({
    by: ["sellerId", "status"],
    where: { sellerId: { in: sellerIds } },
    _count: { _all: true },
  });
  return groups.map((group) => ({ sellerId: group.sellerId, status: group.status, count: group._count._all }));
}

// ─── Moderation writes ───────────────────────────────────────────────────────────────────
// Each change is conditional on the status the service checked and is written in one
// transaction with its log row: either both happen or neither does.

export async function findUserForModeration(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, name: true, companyName: true },
  });
}

export async function findAssetForModeration(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });
}

interface UserChange {
  managerId: string;
  userId: string;
  action: Exclude<UserModeration, "REMOVE_USER">;
  expected: UserStatus;
  next: UserStatus;
  reason: string;
}

/**
 * Suspend or reinstate. Suspension deletes every session in the same transaction, so the
 * user is logged out on their very next request. False if the status changed meanwhile.
 */
export async function changeUserStatus(change: UserChange): Promise<boolean> {
  const { managerId, userId, action, expected, next, reason } = change;
  return db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: userId, status: expected, role: { not: "MANAGER" } },
      data: { status: next, statusReason: next === "ACTIVE" ? null : reason },
    });
    if (count !== 1) return false;
    if (next !== "ACTIVE") await tx.session.deleteMany({ where: { userId } });
    await tx.moderationLog.create({ data: { managerId, action, targetUserId: userId, reason }, select: { id: true } });
    return true;
  });
}

/**
 * SPEC §4.3 removal: logged out, personal data replaced, buyer profile deleted, every asset
 * removed. The row itself stays, so conversations and the log keep their foreign keys.
 */
export async function removeUser(change: Omit<UserChange, "action" | "next">): Promise<boolean> {
  const { managerId, userId, expected, reason } = change;
  return db.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: userId, status: expected, role: { not: "MANAGER" } },
      data: {
        status: "REMOVED",
        statusReason: reason,
        name: REMOVED_USER_NAME,
        companyName: null,
        // Unique and undeliverable (RFC 2606 `.invalid`); the old address can register again.
        email: `removed-${userId}@removed.invalid`,
      },
    });
    if (count !== 1) return false;
    await tx.session.deleteMany({ where: { userId } });
    await tx.buyerProfile.deleteMany({ where: { userId } });
    await tx.asset.updateMany({
      where: { sellerId: userId, status: { not: "REMOVED" } },
      data: { status: "REMOVED", statusReason: `Seller account removed: ${reason}` },
    });
    await tx.moderationLog.create({
      data: { managerId, action: "REMOVE_USER", targetUserId: userId, reason },
      select: { id: true },
    });
    return true;
  });
}

interface AssetChange {
  managerId: string;
  assetId: string;
  action: AssetModeration;
  expected: AssetStatus;
  data: Pick<Prisma.AssetUpdateManyMutationInput, "status" | "statusReason" | "publishedAt">;
  reason: string;
}

/** Hide, unhide, or remove an asset. False if its status changed meanwhile. */
export async function changeAssetStatus(change: AssetChange): Promise<boolean> {
  const { managerId, assetId, action, expected, data, reason } = change;
  return db.$transaction(async (tx) => {
    const { count } = await tx.asset.updateMany({ where: { id: assetId, status: expected }, data });
    if (count !== 1) return false;
    await tx.moderationLog.create({ data: { managerId, action, targetAssetId: assetId, reason }, select: { id: true } });
    return true;
  });
}
