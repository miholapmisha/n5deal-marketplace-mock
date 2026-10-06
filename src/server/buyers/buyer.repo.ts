import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { type BuyerFilters, MAX_BUYER_KEYWORDS } from "@/lib/buyer-filters";
import type { BuyerProfileInput } from "@/server/buyers/buyer.schema";
import { db } from "@/server/db";
import { listedBuyerWhere } from "@/server/policies/buyer-visibility";
import { containsWord, searchWords } from "@/server/text-search";

const profileSelect = {
  buyerType: true,
  ticketMinEur: true,
  ticketMaxEur: true,
  categories: true,
  countries: true,
  statusPref: true,
  timeline: true,
  thesis: true,
  isVisible: true,
} as const;

export async function findBuyerProfile(userId: string) {
  return db.buyerProfile.findUnique({ where: { userId }, select: profileSelect });
}

export async function findBuyerDetail(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      companyName: true,
      role: true,
      status: true,
      createdAt: true,
      buyerProfile: { select: { ...profileSelect, updatedAt: true } },
    },
  });
}

export async function saveBuyerProfile(userId: string, input: BuyerProfileInput): Promise<{ existed: boolean }> {
  const { companyName, ticketMin, ticketMax, ...rest } = input;
  const profile = { ...rest, ticketMinEur: ticketMin, ticketMaxEur: ticketMax };

  return db.$transaction(async (tx) => {
    const existing = await tx.buyerProfile.findUnique({ where: { userId }, select: { userId: true } });
    await tx.buyerProfile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile });
    await tx.user.update({ where: { id: userId }, data: { companyName } });
    return { existed: existing !== null };
  });
}

const matchProfileSelect = {
  categories: true,
  countries: true,
  ticketMinEur: true,
  ticketMaxEur: true,
  statusPref: true,
  updatedAt: true,
} as const satisfies Prisma.BuyerProfileSelect;

const buyerCardSelect = {
  id: true,
  name: true,
  companyName: true,
  buyerProfile: { select: { ...matchProfileSelect, buyerType: true, timeline: true, thesis: true } },
} as const satisfies Prisma.UserSelect;

function keywordWhere(q: string): Prisma.UserWhereInput[] {
  return searchWords(q, MAX_BUYER_KEYWORDS).map((word) => {
    const contains = containsWord(word);
    return { OR: [{ name: contains }, { companyName: contains }, { buyerProfile: { is: { thesis: contains } } }] };
  });
}

function directoryWhere(filters: BuyerFilters): Prisma.UserWhereInput {
  const profile: Prisma.BuyerProfileWhereInput[] = [];
  if (filters.categories.length > 0) {
    profile.push({ OR: [{ categories: { hasSome: filters.categories } }, { categories: { isEmpty: true } }] });
  }
  if (filters.countries.length > 0) {
    profile.push({ OR: [{ countries: { hasSome: filters.countries } }, { countries: { isEmpty: true } }] });
  }
  if (filters.buyerTypes.length > 0) profile.push({ buyerType: { in: filters.buyerTypes } });
  if (filters.ticketMax !== null) {
    profile.push({ OR: [{ ticketMinEur: null }, { ticketMinEur: { lte: filters.ticketMax } }] });
  }
  if (filters.ticketMin !== null) {
    profile.push({ OR: [{ ticketMaxEur: null }, { ticketMaxEur: { gte: filters.ticketMin } }] });
  }

  const conditions: Prisma.UserWhereInput[] = [listedBuyerWhere];
  if (filters.q) conditions.push(...keywordWhere(filters.q));
  if (profile.length > 0) conditions.push({ buyerProfile: { is: { AND: profile } } });
  return { AND: conditions };
}

const DIRECTORY_ORDER: Prisma.UserOrderByWithRelationInput[] = [{ buyerProfile: { updatedAt: "desc" } }, { id: "asc" }];

export async function findDirectoryBuyers(filters: BuyerFilters, skip: number, take: number) {
  return db.user.findMany({ where: directoryWhere(filters), select: buyerCardSelect, orderBy: DIRECTORY_ORDER, skip, take });
}

export async function countDirectoryBuyers(filters: BuyerFilters): Promise<number> {
  return db.user.count({ where: directoryWhere(filters) });
}

export async function findDirectoryMatchFacts(filters: BuyerFilters, take: number) {
  return db.user.findMany({
    where: directoryWhere(filters),
    select: { id: true, buyerProfile: { select: matchProfileSelect } },
    orderBy: DIRECTORY_ORDER,
    take,
  });
}

export async function findDirectoryBuyersByIds(ids: string[]) {
  return db.user.findMany({ where: { AND: [listedBuyerWhere, { id: { in: ids } }] }, select: buyerCardSelect });
}

export async function findDirectoryCountries(): Promise<string[]> {
  const rows = await db.buyerProfile.findMany({ where: { user: listedBuyerWhere }, select: { countries: true } });
  return [...new Set(rows.flatMap((row) => row.countries))];
}
