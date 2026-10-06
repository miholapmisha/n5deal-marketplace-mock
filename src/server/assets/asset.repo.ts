import "server-only";

import type { Category, Prisma } from "@/generated/prisma/client";
import { type CatalogFilters, type CatalogSort, MAX_KEYWORDS } from "@/lib/catalog-filters";
import { countryCodesMatching } from "@/lib/countries";
import { db } from "@/server/db";
import { publicAssetWhere } from "@/server/policies/asset-visibility";

// Fields the catalog card needs. Seller identity is deliberately excluded (SPEC §1.4).
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

/** Prisma passes `contains` through to ILIKE; escape its wildcards so "%" means "%". */
function likeLiteral(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Every word must appear in at least one text field (or name the asset's country). */
function keywordWhere(q: string): Prisma.AssetWhereInput[] {
  return q
    .split(" ")
    .slice(0, MAX_KEYWORDS)
    .map((word) => {
      const contains = { contains: likeLiteral(word), mode: "insensitive" } as const;
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

/**
 * Public visibility AND every active filter. `ignoreCategories` builds the base for the
 * category facet counts, which respect every filter except the category itself.
 */
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
  // A price bound excludes "price on request" listings: SQL comparisons with NULL are false.
  if (filters.priceMin !== null) conditions.push({ priceEur: { gte: filters.priceMin } });
  if (filters.priceMax !== null) conditions.push({ priceEur: { lte: filters.priceMax } });
  return { AND: conditions };
}

/** `id` breaks ties, so pagination is stable when two rows share a price or a date. */
const CATALOG_ORDER: Record<CatalogSort, Prisma.AssetOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: "desc" }, { id: "asc" }],
  "price-asc": [{ priceEur: { sort: "asc", nulls: "last" } }, { publishedAt: "desc" }, { id: "asc" }],
  "price-desc": [{ priceEur: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }, { id: "asc" }],
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

/** Matching assets per category, ignoring the category filter (facet counts, SPEC §5 S3). */
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

/** Option lists for the filter panel: values that occur on at least one public asset. */
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

export async function findConversationId(assetId: string, buyerId: string): Promise<string | null> {
  const conversation = await db.conversation.findUnique({
    where: { assetId_buyerId: { assetId, buyerId } },
    select: { id: true },
  });
  return conversation?.id ?? null;
}

export async function findAssetOwnership(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, slug: true, sellerId: true, status: true },
  });
}

/**
 * PUBLISHED → DRAFT. Status and owner sit in the WHERE clause, so a manager hiding the asset
 * at the same moment cannot be overwritten. Returns false if nothing matched.
 */
export async function unpublishIfPublished(assetId: string, sellerId: string): Promise<boolean> {
  const { count } = await db.asset.updateMany({
    where: { id: assetId, sellerId, status: "PUBLISHED" },
    data: { status: "DRAFT", publishedAt: null },
  });
  return count === 1;
}
