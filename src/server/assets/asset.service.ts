import "server-only";

import { cache } from "react";

import type { Role } from "@/generated/prisma/client";
import { Category } from "@/generated/prisma/enums";
import { CATALOG_PAGE_SIZE, type CatalogFilters } from "@/lib/catalog-filters";
import { countryName } from "@/lib/format";
import {
  countCatalogAssetsByCategory,
  findAssetDetailBySlug,
  findAssetOwnership,
  findCatalogAssets,
  findCatalogFacetValues,
  findConversationId,
  unpublishIfPublished,
} from "@/server/assets/asset.repo";
import { getCurrentUser } from "@/server/auth/session";
import {
  canSeeSellerIdentity,
  canViewAsset,
  isAssetOwner,
  isPubliclyVisible,
} from "@/server/policies/asset-visibility";

export type AssetCardData = Awaited<ReturnType<typeof findCatalogAssets>>[number];

const CATEGORIES = Object.values(Category);

// ─── Catalog (S3) ────────────────────────────────────────────────────────────────────────

export interface CatalogPage {
  assets: AssetCardData[];
  /** Assets matching every filter. */
  total: number;
  /** The page actually shown: a page past the end is clamped to the last one. */
  page: number;
  pageCount: number;
  /** Per category, matching every filter except the category (tab counts). */
  categoryCounts: Record<Category, number>;
  /** The "All" tab: the sum of every category count. */
  allCount: number;
}

function findPage(filters: CatalogFilters, page: number): Promise<AssetCardData[]> {
  return findCatalogAssets(filters, (page - 1) * CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE);
}

export async function listCatalog(filters: CatalogFilters): Promise<CatalogPage> {
  // Both queries in parallel. Only a page past the end (stale link) costs a second fetch.
  const [groups, requestedRows] = await Promise.all([
    countCatalogAssetsByCategory(filters),
    findPage(filters, filters.page),
  ]);
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((category) => [category, groups.find((group) => group.category === category)?.count ?? 0]),
  ) as Record<Category, number>;

  // The facet query already counted every match per category, so the result total is just
  // the sum over the selected categories: one query fewer than a separate COUNT(*).
  const allCount = groups.reduce((sum, group) => sum + group.count, 0);
  const total =
    filters.categories.length === 0
      ? allCount
      : filters.categories.reduce((sum, category) => sum + categoryCounts[category], 0);

  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const assets = page === filters.page ? requestedRows : await findPage(filters, page);

  return { assets, total, page, pageCount, categoryCounts, allCount };
}

export interface FacetOption {
  value: string;
  label: string;
}

export interface CatalogFacetOptions {
  countries: FacetOption[];
  licenseTypes: FacetOption[];
  regulators: FacetOption[];
}

const byLabel = (a: FacetOption, b: FacetOption) => a.label.localeCompare(b.label, "en");

/**
 * Values present on public assets, plus any selected in the URL that no longer occur, so a
 * stale link's filter can still be seen and unchecked.
 */
export async function getCatalogFacetOptions(filters: CatalogFilters): Promise<CatalogFacetOptions> {
  const values = await findCatalogFacetValues();
  const merge = (found: string[], selected: string[]) => [...new Set([...found, ...selected])];

  return {
    countries: merge(values.countries, filters.countries)
      .map((code) => ({ value: code, label: countryName(code) }))
      .sort(byLabel),
    licenseTypes: merge(values.licenseTypes, filters.licenseTypes)
      .map((value) => ({ value, label: value }))
      .sort(byLabel),
    regulators: merge(values.regulators, filters.regulators)
      .map((value) => ({ value, label: value }))
      .sort(byLabel),
  };
}

// ─── Asset detail (S4) ───────────────────────────────────────────────────────────────────

type AssetDetailRow = NonNullable<Awaited<ReturnType<typeof findAssetDetailBySlug>>>;

export type AssetDetail = Omit<AssetDetailRow, "seller">;

export interface AssetDetailView {
  asset: AssetDetail;
  viewerRole: Role | null;
  isOwner: boolean;
  /** False for drafts, hidden/removed assets, and assets of a suspended or removed seller. */
  isPublic: boolean;
  sellerStatus: AssetDetailRow["seller"]["status"];
  /** Company (or person) name, or null while the seller stays anonymous. */
  sellerName: string | null;
  /** The viewing buyer's existing thread about this asset. */
  conversationId: string | null;
}

/** Slugs are generated as lower-case words and digits joined by hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;

/**
 * The asset as this viewer may see it, or null (→ 404) if they may not. Memoized per
 * request: `generateMetadata` and the page both ask for it.
 */
export const getAssetDetail = cache(async (slug: string): Promise<AssetDetailView | null> => {
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) return null;

  const [viewer, row] = await Promise.all([getCurrentUser(), findAssetDetailBySlug(slug)]);
  if (!row || !canViewAsset(row, viewer)) return null;

  const conversationId = viewer?.role === "BUYER" ? await findConversationId(row.id, viewer.id) : null;
  const { seller, ...asset } = row;

  return {
    asset,
    viewerRole: viewer?.role ?? null,
    isOwner: isAssetOwner(row, viewer),
    isPublic: isPubliclyVisible(row),
    sellerStatus: seller.status,
    sellerName: canSeeSellerIdentity(row, viewer, conversationId !== null)
      ? (seller.companyName ?? seller.name)
      : null,
    conversationId,
  };
});

// ─── Owner actions ───────────────────────────────────────────────────────────────────────

export type UnpublishResult = { ok: true; slug: string } | { ok: false; error: string };

/** Owner takes a published asset off the catalog (PUBLISHED → DRAFT). */
export async function unpublishAsset(assetId: string): Promise<UnpublishResult> {
  const [user, asset] = await Promise.all([getCurrentUser(), findAssetOwnership(assetId)]);
  if (!user) return { ok: false, error: "Your session has expired. Log in again." };
  // Same answer for "missing" and "not yours", so asset IDs cannot be probed.
  if (!asset || !isAssetOwner(asset, user) || asset.status === "REMOVED") {
    return { ok: false, error: "Asset not found." };
  }
  if (asset.status === "HIDDEN") {
    return { ok: false, error: "A manager has hidden this asset; it is already off the catalog." };
  }
  if (asset.status !== "PUBLISHED") return { ok: false, error: "This asset is not published." };

  const changed = await unpublishIfPublished(asset.id, user.id);
  if (!changed) return { ok: false, error: "This asset changed in the meantime. Refresh and try again." };
  return { ok: true, slug: asset.slug };
}
