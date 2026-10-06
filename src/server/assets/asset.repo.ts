import "server-only";

import type { AssetStatus, Category, Prisma } from "@/generated/prisma/client";
import { type CatalogFilters, type CatalogSort, MAX_KEYWORDS } from "@/lib/catalog-filters";
import { countryCodesMatching } from "@/lib/countries";
import { db } from "@/server/db";
import { isUniqueViolation } from "@/server/prisma-errors";
import { publicAssetWhere } from "@/server/policies/asset-visibility";
import { containsWord, searchWords } from "@/server/text-search";

export const assetCardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  businessStatus: true,
  country: true,
  regulator: true,
  licenseType: true,
  priceEur: true,
  benefits: true,
  description: true,
  publishedAt: true,
} as const satisfies Prisma.AssetSelect;

const assetDetailSelect = {
  ...assetCardSelect,
  sellerId: true,
  otherLicenses: true,
  yearOfIssue: true,
  employees: true,
  status: true,
  statusReason: true,
  seller: { select: { status: true, name: true, companyName: true } },
} as const satisfies Prisma.AssetSelect;

function keywordWhere(q: string): Prisma.AssetWhereInput[] {
  return searchWords(q, MAX_KEYWORDS).map((word) => {
    const contains = containsWord(word);
    const countries = countryCodesMatching(word);
    return {
      OR: [
        { title: contains },
        { description: contains },
        { licenseType: contains },
        { regulator: contains },
        ...(countries.length > 0 ? [{ country: { in: countries } }] : []),
      ],
    };
  });
}

function catalogWhere(filters: CatalogFilters, { ignoreCategories = false } = {}): Prisma.AssetWhereInput {
  const conditions: Prisma.AssetWhereInput[] = [publicAssetWhere];
  if (filters.q) conditions.push(...keywordWhere(filters.q));
  if (!ignoreCategories && filters.categories.length > 0) {
    conditions.push({ category: { in: filters.categories } });
  }
  if (filters.countries.length > 0) conditions.push({ country: { in: filters.countries } });
  if (filters.businessStatuses.length > 0) {
    conditions.push({ businessStatus: { in: filters.businessStatuses } });
  }
  if (filters.licenseTypes.length > 0) conditions.push({ licenseType: { in: filters.licenseTypes } });
  if (filters.regulators.length > 0) conditions.push({ regulator: { in: filters.regulators } });
  if (filters.priceMin !== null) conditions.push({ priceEur: { gte: filters.priceMin } });
  if (filters.priceMax !== null) conditions.push({ priceEur: { lte: filters.priceMax } });
  return { AND: conditions };
}

const NEWEST_FIRST: Prisma.AssetOrderByWithRelationInput[] = [{ publishedAt: "desc" }, { id: "asc" }];

const CATALOG_ORDER: Record<CatalogSort, Prisma.AssetOrderByWithRelationInput[]> = {
  newest: NEWEST_FIRST,
  "price-asc": [{ priceEur: { sort: "asc", nulls: "last" } }, ...NEWEST_FIRST],
  "price-desc": [{ priceEur: { sort: "desc", nulls: "last" } }, ...NEWEST_FIRST],
  "best-match": NEWEST_FIRST,
};

export async function findCatalogAssets(filters: CatalogFilters, skip: number, take: number) {
  return db.asset.findMany({
    where: catalogWhere(filters),
    select: assetCardSelect,
    orderBy: CATALOG_ORDER[filters.sort],
    skip,
    take,
  });
}

export async function findCatalogMatchFacts(filters: CatalogFilters, take: number) {
  return db.asset.findMany({
    where: catalogWhere(filters),
    select: { id: true, category: true, country: true, priceEur: true, businessStatus: true, publishedAt: true },
    orderBy: NEWEST_FIRST,
    take,
  });
}

export async function findCatalogAssetsByIds(ids: string[]) {
  return db.asset.findMany({ where: { AND: [publicAssetWhere, { id: { in: ids } }] }, select: assetCardSelect });
}

export async function countCatalogAssetsByCategory(
  filters: CatalogFilters,
): Promise<{ category: Category; count: number }[]> {
  const groups = await db.asset.groupBy({
    by: ["category"],
    where: catalogWhere(filters, { ignoreCategories: true }),
    _count: { _all: true },
  });
  return groups.map((group) => ({ category: group.category, count: group._count._all }));
}

async function distinctPublicValues(field: "country" | "licenseType" | "regulator"): Promise<string[]> {
  const groups = await db.asset.groupBy({ by: [field], where: publicAssetWhere });
  return groups.map((group) => group[field]).filter((value): value is string => value !== null);
}

export function findPublicLicenseTypes(): Promise<string[]> {
  return distinctPublicValues("licenseType");
}

export async function findCatalogFacetValues() {
  const [countries, licenseTypes, regulators] = await Promise.all([
    distinctPublicValues("country"),
    distinctPublicValues("licenseType"),
    distinctPublicValues("regulator"),
  ]);
  return { countries, licenseTypes, regulators };
}

export async function findAssetDetailBySlug(slug: string) {
  return db.asset.findUnique({ where: { slug }, select: assetDetailSelect });
}

export async function findPublishedAssetsOf(sellerId: string) {
  return db.asset.findMany({
    where: { sellerId, status: "PUBLISHED" },
    orderBy: NEWEST_FIRST,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      country: true,
      priceEur: true,
      businessStatus: true,
      publishedAt: true,
    },
  });
}

export async function findConversationId(assetId: string, buyerId: string): Promise<string | null> {
  const conversation = await db.conversation.findUnique({
    where: { assetId_buyerId: { assetId, buyerId } },
    select: { id: true },
  });
  return conversation?.id ?? null;
}

export async function findOwnAssets(sellerId: string) {
  return db.asset.findMany({
    where: { sellerId, status: { not: "REMOVED" } },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      priceEur: true,
      status: true,
      statusReason: true,
      updatedAt: true,
      _count: { select: { conversations: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
}

export async function findAssetForEdit(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    select: {
      ...assetCardSelect,
      sellerId: true,
      otherLicenses: true,
      yearOfIssue: true,
      employees: true,
      status: true,
      statusReason: true,
    },
  });
}

export type AssetWriteData = Omit<Prisma.AssetUncheckedCreateInput, "id" | "slug" | "createdAt" | "updatedAt">;

const SLUG_ATTEMPTS = 3;

export async function insertAsset(data: AssetWriteData, nextSlug: () => string): Promise<{ slug: string }> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.asset.create({ data: { ...data, slug: nextSlug() }, select: { slug: true } });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= SLUG_ATTEMPTS) throw error;
    }
  }
}

export async function updateAssetIfStatus(
  assetId: string,
  sellerId: string,
  expectedStatus: AssetStatus,
  data: Partial<AssetWriteData>,
): Promise<boolean> {
  const { count } = await db.asset.updateMany({ where: { id: assetId, sellerId, status: expectedStatus }, data });
  return count === 1;
}

export async function findAssetOwnership(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, slug: true, sellerId: true, status: true },
  });
}

export async function unpublishIfPublished(assetId: string, sellerId: string): Promise<boolean> {
  return updateAssetIfStatus(assetId, sellerId, "PUBLISHED", { status: "DRAFT", publishedAt: null });
}

export async function publishIfDraft(assetId: string, sellerId: string): Promise<boolean> {
  return updateAssetIfStatus(assetId, sellerId, "DRAFT", { status: "PUBLISHED", publishedAt: new Date() });
}
