import "server-only";

import { cache } from "react";

import { BUYERS_PAGE_SIZE, type BuyerFilters } from "@/lib/buyer-filters";
import type { CountryOption } from "@/lib/countries";
import { countryName } from "@/lib/format";
import { findPublishedAssetsOf } from "@/server/assets/asset.repo";
import { getCurrentUser } from "@/server/auth/session";
import {
  countDirectoryBuyers,
  findBuyerDetail,
  findBuyerProfile,
  findDirectoryBuyers,
  findDirectoryBuyersByIds,
  findDirectoryCountries,
  findDirectoryMatchFacts,
  saveBuyerProfile,
} from "@/server/buyers/buyer.repo";
import type { BuyerProfileInput } from "@/server/buyers/buyer.schema";
import { recordId } from "@/server/form-fields";
import { type MatchAsset, type MatchProfile, matchScore } from "@/server/matching/match-score";
import { inRankedOrder, MAX_RANKED_ROWS, rankBy, rankedPage } from "@/server/matching/rank";
import { canBrowseBuyers, isBuyerListed } from "@/server/policies/buyer-visibility";

export type BuyerProfileRow = NonNullable<Awaited<ReturnType<typeof findBuyerProfile>>>;

export interface OwnBuyerProfile {
  companyName: string | null;
  /** null until the buyer saves the onboarding form for the first time. */
  profile: BuyerProfileRow | null;
}

/** S5: the logged-in buyer's own profile. Null for anyone who is not a buyer. */
export async function getOwnBuyerProfile(): Promise<OwnBuyerProfile | null> {
  const user = await getCurrentUser();
  if (user?.role !== "BUYER") return null;
  return { companyName: user.companyName, profile: await findBuyerProfile(user.id) };
}

/** Whether the viewer is a buyer, and the profile their match scores are computed from. */
export interface ViewerMatchContext {
  isBuyer: boolean;
  /** Null for non-buyers and for buyers who have not saved a profile yet. */
  profile: MatchProfile | null;
}

/**
 * The buyer → asset direction of the match score (SPEC §2: buyers only). Memoized per
 * request: the catalog and the asset detail page both ask.
 */
export const getViewerMatchContext = cache(async (): Promise<ViewerMatchContext> => {
  const user = await getCurrentUser();
  if (user?.role !== "BUYER") return { isBuyer: false, profile: null };
  return { isBuyer: true, profile: await findBuyerProfile(user.id) };
});

export type SaveProfileResult = { ok: true; firstSave: boolean } | { ok: false; error: string };

export async function saveOwnBuyerProfile(input: BuyerProfileInput): Promise<SaveProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Log in again." };
  if (user.role !== "BUYER") return { ok: false, error: "Only buyers have an acquisition profile." };

  const { existed } = await saveBuyerProfile(user.id, input);
  return { ok: true, firstSave: !existed };
}

// ─── Buyer detail (S9) ───────────────────────────────────────────────────────────────────

type BuyerDetailRow = NonNullable<Awaited<ReturnType<typeof findBuyerDetail>>>;

export interface BuyerDetail extends Omit<BuyerDetailRow, "role" | "status" | "buyerProfile"> {
  profile: NonNullable<BuyerDetailRow["buyerProfile"]>;
}

/**
 * A listed buyer as an active seller or a manager sees them, or null (→ 404) when the viewer
 * may not browse buyers or the buyer is not listed (SPEC §4.1). Memoized per request: the
 * page and its metadata both ask.
 */
export const getBuyerDetail = cache(async (buyerId: string): Promise<BuyerDetail | null> => {
  if (!recordId.safeParse(buyerId).success) return null;
  const [viewer, row] = await Promise.all([getCurrentUser(), findBuyerDetail(buyerId)]);
  if (!canBrowseBuyers(viewer) || !row || !isBuyerListed(row) || !row.buyerProfile) return null;

  const { id, name, companyName, createdAt, buyerProfile } = row;
  return { id, name, companyName, createdAt, profile: buyerProfile };
});

// ─── Buyer directory (S8) ────────────────────────────────────────────────────────────────

type DirectoryRow = Awaited<ReturnType<typeof findDirectoryBuyers>>[number];

export interface BuyerCardData extends Omit<DirectoryRow, "buyerProfile"> {
  profile: NonNullable<DirectoryRow["buyerProfile"]>;
  /** Fit with the asset buyers are ranked for, or null when not ranking. */
  match: number | null;
}

export interface RankOption {
  id: string;
  title: string;
}

export interface BuyerDirectoryPage {
  buyers: BuyerCardData[];
  total: number;
  /** The page actually shown: a page past the end is clamped to the last one. */
  page: number;
  pageCount: number;
  /** The asset the list is ranked for, or null (no `rank`, or not one of the viewer's). */
  rankedFor: RankOption | null;
  /** A seller's published assets to rank for; null for managers, who own none. */
  rankOptions: RankOption[] | null;
}

/** Listed buyers always have a profile (`listedBuyerWhere`); this keeps the types honest. */
function toCard(row: DirectoryRow, match: number | null): BuyerCardData[] {
  const { buyerProfile, ...buyer } = row;
  return buyerProfile ? [{ ...buyer, profile: buyerProfile, match }] : [];
}

function pageCountFor(total: number): number {
  return Math.max(1, Math.ceil(total / BUYERS_PAGE_SIZE));
}

/** Most recently updated profiles first, one page. */
async function listByRecency(filters: BuyerFilters) {
  const skip = (page: number) => (page - 1) * BUYERS_PAGE_SIZE;
  const [total, requestedRows] = await Promise.all([
    countDirectoryBuyers(filters),
    findDirectoryBuyers(filters, skip(filters.page), BUYERS_PAGE_SIZE),
  ]);
  const page = Math.min(filters.page, pageCountFor(total));
  const rows =
    page === filters.page ? requestedRows : await findDirectoryBuyers(filters, skip(page), BUYERS_PAGE_SIZE);
  return { buyers: rows.flatMap((row) => toCard(row, null)), total, page };
}

/** "Rank for": every match scored against the asset (seller → buyer), best first. */
async function listByMatch(filters: BuyerFilters, asset: MatchAsset) {
  const facts = await findDirectoryMatchFacts(filters, MAX_RANKED_ROWS);
  const ranked = rankBy(
    facts.flatMap((row) => (row.buyerProfile ? [{ id: row.id, profile: row.buyerProfile }] : [])),
    (buyer) => matchScore(asset, buyer.profile),
    (buyer) => buyer.profile.updatedAt,
  );
  const total = ranked.length;
  const page = Math.min(filters.page, pageCountFor(total));
  const shown = rankedPage(ranked, page, BUYERS_PAGE_SIZE);
  const scores = new Map(shown.map((entry) => [entry.id, entry.score]));
  const rows = inRankedOrder(await findDirectoryBuyersByIds(shown.map((entry) => entry.id)), shown);
  return { buyers: rows.flatMap((row) => toCard(row, scores.get(row.id) ?? null)), total, page };
}

/**
 * S8 for an active seller or a manager; null for anyone else (SPEC §4.1). `rank` is honoured
 * only when it names one of the viewing seller's published assets; otherwise it is ignored.
 */
export async function listBuyerDirectory(filters: BuyerFilters): Promise<BuyerDirectoryPage | null> {
  const viewer = await getCurrentUser();
  if (!viewer || !canBrowseBuyers(viewer)) return null;

  const ownAssets = viewer.role === "SELLER" ? await findPublishedAssetsOf(viewer.id) : null;
  const rankAsset = ownAssets?.find((asset) => asset.id === filters.rank) ?? null;
  const result = rankAsset ? await listByMatch(filters, rankAsset) : await listByRecency(filters);

  return {
    ...result,
    pageCount: pageCountFor(result.total),
    rankedFor: rankAsset ? { id: rankAsset.id, title: rankAsset.title } : null,
    rankOptions: ownAssets?.map(({ id, title }) => ({ id, title })) ?? null,
  };
}

/**
 * Country filter options: countries listed buyers target, plus any selected in the URL, so
 * a stale link's filter can still be seen and unchecked. Empty for viewers who may not
 * browse buyers.
 */
export async function getDirectoryCountryOptions(selected: string[]): Promise<CountryOption[]> {
  if (!canBrowseBuyers(await getCurrentUser())) return [];
  const found = await findDirectoryCountries();
  return [...new Set([...found, ...selected])]
    .map((code) => ({ value: code, label: countryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}
