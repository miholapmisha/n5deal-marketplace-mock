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
  findCatalogAssetsByIds,
  findCatalogFacetValues,
  findCatalogMatchFacts,
  findConversationId,
  findOwnAssets,
  findPublicLicenseTypes,
  insertAsset,
  publishIfDraft,
  unpublishIfPublished,
  updateAssetIfStatus,
} from "@/server/assets/asset.repo";
import { type AssetInput, assetIdSchema } from "@/server/assets/asset.schema";
import { type CurrentUser, getCurrentUser } from "@/server/auth/session";
import { getViewerMatchContext } from "@/server/buyers/buyer.service";
import { type MatchProfile, matchScore } from "@/server/matching/match-score";
import { inRankedOrder, MAX_RANKED_ROWS, type Ranked, rankBy, rankedPage } from "@/server/matching/rank";
import {
  canSeeSellerIdentity,
  canViewAsset,
  isAssetOwner,
  isPubliclyVisible,
} from "@/server/policies/asset-visibility";

export type AssetCardData = Awaited<ReturnType<typeof findCatalogAssets>>[number];

const CATEGORIES = Object.values(Category);

export interface CatalogAsset extends AssetCardData {
  match: number | null;
}

export type BestMatchAvailability = "available" | "needs-profile" | "hidden";

export interface CatalogPage {
  assets: CatalogAsset[];
  total: number;
  page: number;
  pageCount: number;
  sort: CatalogFilters["sort"];
  bestMatch: BestMatchAvailability;
  categoryCounts: Record<Category, number>;
  allCount: number;
}

function findPage(filters: CatalogFilters, page: number): Promise<AssetCardData[]> {
  return findCatalogAssets(filters, (page - 1) * CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZE);
}

async function rankCatalog(filters: CatalogFilters, profile: MatchProfile): Promise<Ranked[]> {
  const facts = await findCatalogMatchFacts(filters, MAX_RANKED_ROWS);
  return rankBy(facts, (asset) => matchScore(asset, profile), (asset) => asset.publishedAt);
}

async function findRankedPage(ranked: Ranked[], page: number): Promise<AssetCardData[]> {
  const shown = rankedPage(ranked, page, CATALOG_PAGE_SIZE);
  return inRankedOrder(await findCatalogAssetsByIds(shown.map((entry) => entry.id)), shown);
}

export async function listCatalog(requested: CatalogFilters): Promise<CatalogPage> {
  const { isBuyer, profile } = await getViewerMatchContext();
  const filters: CatalogFilters =
    requested.sort === "best-match" && !profile ? { ...requested, sort: "newest" } : requested;
  const ranking = filters.sort === "best-match" ? profile : null;

  const [groups, ranked, requestedRows] = await Promise.all([
    countCatalogAssetsByCategory(filters),
    ranking ? rankCatalog(filters, ranking) : null,
    ranking ? null : findPage(filters, filters.page),
  ]);
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((category) => [category, groups.find((group) => group.category === category)?.count ?? 0]),
  ) as Record<Category, number>;

  const allCount = groups.reduce((sum, group) => sum + group.count, 0);
  const total =
    ranked?.length ??
    (filters.categories.length === 0
      ? allCount
      : filters.categories.reduce((sum, category) => sum + categoryCounts[category], 0));

  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const rows = ranked
    ? await findRankedPage(ranked, page)
    : requestedRows && page === filters.page
      ? requestedRows
      : await findPage(filters, page);

  return {
    assets: rows.map((row) => ({ ...row, match: profile ? matchScore(row, profile) : null })),
    total,
    page,
    pageCount,
    sort: filters.sort,
    bestMatch: profile ? "available" : isBuyer ? "needs-profile" : "hidden",
    categoryCounts,
    allCount,
  };
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

export async function listCatalogLicenseTypes(): Promise<string[]> {
  const licenseTypes = await findPublicLicenseTypes();
  return [...licenseTypes].sort((a, b) => a.localeCompare(b, "en"));
}

type AssetDetailRow = NonNullable<Awaited<ReturnType<typeof findAssetDetailBySlug>>>;

export type AssetDetail = Omit<AssetDetailRow, "seller">;

export interface AssetDetailView {
  asset: AssetDetail;
  viewerRole: Role | null;
  isOwner: boolean;
  isPublic: boolean;
  sellerStatus: AssetDetailRow["seller"]["status"];
  sellerName: string | null;
  conversationId: string | null;
  match: number | null;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 120;

export const getAssetDetail = cache(async (slug: string): Promise<AssetDetailView | null> => {
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) return null;

  const [viewer, row, { profile }] = await Promise.all([
    getCurrentUser(),
    findAssetDetailBySlug(slug),
    getViewerMatchContext(),
  ]);
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
    match: profile ? matchScore(row, profile) : null,
  };
});

const SESSION_EXPIRED = "Your session has expired. Log in again.";
const NOT_FOUND = "Asset not found.";
const CHANGED = "This asset changed in the meantime. Refresh and try again.";

export type OwnAssetRow = Awaited<ReturnType<typeof findOwnAssets>>[number];

export async function listOwnAssets(): Promise<OwnAssetRow[]> {
  const user = await getCurrentUser();
  if (user?.role !== "SELLER") return [];
  return findOwnAssets(user.id);
}

export type AssetForEdit = NonNullable<Awaited<ReturnType<typeof findAssetForEdit>>>;

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

function newAssetSlug(country: string, licenseType: string): string {
  const words = [slugWords(countryName(country)), slugWords(licenseType)].filter(Boolean).join("-");
  const base = words.slice(0, SLUG_BASE_MAX).replace(/-+$/, "") || "asset";
  return `${base}-${randomInt(100_000, 1_000_000)}`;
}

function statusAfterSave(current: AssetStatus | null, intent: AssetIntent): Partial<AssetWriteData> {
  if (current === "HIDDEN") return {};
  if (intent === "draft") return { status: "DRAFT", publishedAt: null };
  return current === "PUBLISHED" ? {} : { status: "PUBLISHED", publishedAt: new Date() };
}

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
