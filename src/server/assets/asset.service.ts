import "server-only";

import { randomInt } from "node:crypto";
import { cache } from "react";

import type { AssetStatus, Role } from "@/generated/prisma/client";
import { Category } from "@/generated/prisma/enums";
import type { AssetIntent } from "@/lib/asset-form";
import { CATALOG_PAGE_SIZE, type CatalogFilters } from "@/lib/catalog-filters";
import { countryName } from "@/lib/format";
import {
  type AssetWriteData,
  countCatalogAssetsByCategory,
  findAssetDetailBySlug,
  findAssetForEdit,
  findAssetOwnership,
  findCatalogAssets,
  findCatalogFacetValues,
  findConversationId,
  findOwnAssets,
  insertAsset,
  publishIfDraft,
  unpublishIfPublished,
  updateAssetIfStatus,
} from "@/server/assets/asset.repo";
import { type AssetInput, assetIdSchema } from "@/server/assets/asset.schema";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
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

// ─── Owner (S6, S7) ──────────────────────────────────────────────────────────────────────

const SESSION_EXPIRED = "Your session has expired. Log in again.";
const NOT_FOUND = "Asset not found.";
const CHANGED = "This asset changed in the meantime. Refresh and try again.";

export type OwnAssetRow = Awaited<ReturnType<typeof findOwnAssets>>[number];

/** S6: the seller's own assets in every status except REMOVED, recently edited first. */
export async function listOwnAssets(): Promise<OwnAssetRow[]> {
  const user = await getCurrentUser();
  if (user?.role !== "SELLER") return [];
  return findOwnAssets(user.id);
}

export type AssetForEdit = NonNullable<Awaited<ReturnType<typeof findAssetForEdit>>>;

/** S7 edit: the owner's asset, or null (→ 404) when it is missing, foreign, or removed. */
export async function getAssetForEdit(assetId: string): Promise<AssetForEdit | null> {
  if (!assetIdSchema.safeParse({ assetId }).success) return null;
  const [user, asset] = await Promise.all([getCurrentUser(), findAssetForEdit(assetId)]);
  if (!asset || !isAssetOwner(asset, user) || asset.status === "REMOVED") return null;
  return asset;
}

export type AssetChangeResult = { ok: true; slug: string } | { ok: false; error: string };

type OwnedAsset = NonNullable<Awaited<ReturnType<typeof findAssetOwnership>>>;
type OwnershipCheck = { ok: true; user: CurrentUser; asset: OwnedAsset } | { ok: false; error: string };

async function checkOwnership(assetId: string): Promise<OwnershipCheck> {
  const [user, asset] = await Promise.all([getCurrentUser(), findAssetOwnership(assetId)]);
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  // Same answer for "missing" and "not yours", so asset IDs cannot be probed.
  if (!asset || !isAssetOwner(asset, user) || asset.status === "REMOVED") return { ok: false, error: NOT_FOUND };
  return { ok: true, user, asset };
}

const SLUG_BASE_MAX = 60;

function slugWords(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "malta-emi-482913": readable like the seed's slugs; the random suffix keeps it unique. */
function newAssetSlug(country: string, licenseType: string): string {
  const words = [slugWords(countryName(country)), slugWords(licenseType)].filter(Boolean).join("-");
  const base = words.slice(0, SLUG_BASE_MAX).replace(/-+$/, "") || "asset";
  return `${base}-${randomInt(100_000, 1_000_000)}`;
}

/**
 * Status fields an owner's save writes. A manager's hide outranks the owner: content edits
 * are saved, but the asset stays HIDDEN until a manager unhides it. `publishedAt` changes
 * only when the asset enters or leaves the catalog, so editing does not bump it to "Newest".
 */
function statusAfterSave(current: AssetStatus | null, intent: AssetIntent): Partial<AssetWriteData> {
  if (current === "HIDDEN") return {};
  if (intent === "draft") return { status: "DRAFT", publishedAt: null };
  return current === "PUBLISHED" ? {} : { status: "PUBLISHED", publishedAt: new Date() };
}

/** S7: create (no `assetId`) or edit an asset, as a draft or published. */
export async function saveAsset(
  assetId: string | undefined,
  intent: AssetIntent,
  input: AssetInput,
): Promise<AssetChangeResult> {
  if (assetId === undefined) {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: SESSION_EXPIRED };
    if (user.role !== "SELLER") return { ok: false, error: "Only sellers can publish assets." };
    const { slug } = await insertAsset(
      { ...input, sellerId: user.id, status: "DRAFT", ...statusAfterSave(null, intent) },
      () => newAssetSlug(input.country, input.licenseType),
    );
    return { ok: true, slug };
  }

  const check = await checkOwnership(assetId);
  if (!check.ok) return check;
  const { user, asset } = check;
  const data = { ...input, ...statusAfterSave(asset.status, intent) };
  const changed = await updateAssetIfStatus(asset.id, user.id, asset.status, data);
  return changed ? { ok: true, slug: asset.slug } : { ok: false, error: CHANGED };
}

/** S6: a draft goes live (DRAFT → PUBLISHED). Drafts pass the same schema as published assets. */
export async function publishAsset(assetId: string): Promise<AssetChangeResult> {
  const check = await checkOwnership(assetId);
  if (!check.ok) return check;
  const { user, asset } = check;
  if (asset.status === "HIDDEN") {
    return { ok: false, error: "A manager has hidden this asset; only a manager can make it public again." };
  }
  if (asset.status !== "DRAFT") return { ok: false, error: "This asset is already published." };

  const changed = await publishIfDraft(asset.id, user.id);
  return changed ? { ok: true, slug: asset.slug } : { ok: false, error: CHANGED };
}

/** Owner takes a published asset off the catalog (PUBLISHED → DRAFT). */
export async function unpublishAsset(assetId: string): Promise<AssetChangeResult> {
  const check = await checkOwnership(assetId);
  if (!check.ok) return check;
  const { user, asset } = check;
  if (asset.status === "HIDDEN") {
    return { ok: false, error: "A manager has hidden this asset; it is already off the catalog." };
  }
  if (asset.status !== "PUBLISHED") return { ok: false, error: "This asset is not published." };

  const changed = await unpublishIfPublished(asset.id, user.id);
  return changed ? { ok: true, slug: asset.slug } : { ok: false, error: CHANGED };
}
