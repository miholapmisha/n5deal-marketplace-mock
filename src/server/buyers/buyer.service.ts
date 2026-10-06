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
  profile: BuyerProfileRow | null;
}

export async function getOwnBuyerProfile(): Promise<OwnBuyerProfile | null> {
  const user = await getCurrentUser();
  if (user?.role !== "BUYER") return null;
  return { companyName: user.companyName, profile: await findBuyerProfile(user.id) };
}

export interface ViewerMatchContext {
  isBuyer: boolean;
  profile: MatchProfile | null;
}

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

type BuyerDetailRow = NonNullable<Awaited<ReturnType<typeof findBuyerDetail>>>;

export interface BuyerDetail extends Omit<BuyerDetailRow, "role" | "status" | "buyerProfile"> {
  profile: NonNullable<BuyerDetailRow["buyerProfile"]>;
}

export const getBuyerDetail = cache(async (buyerId: string): Promise<BuyerDetail | null> => {
  if (!recordId.safeParse(buyerId).success) return null;
  const [viewer, row] = await Promise.all([getCurrentUser(), findBuyerDetail(buyerId)]);
  if (!canBrowseBuyers(viewer) || !row || !isBuyerListed(row) || !row.buyerProfile) return null;

  const { id, name, companyName, createdAt, buyerProfile } = row;
  return { id, name, companyName, createdAt, profile: buyerProfile };
});

type DirectoryRow = Awaited<ReturnType<typeof findDirectoryBuyers>>[number];

export interface BuyerCardData extends Omit<DirectoryRow, "buyerProfile"> {
  profile: NonNullable<DirectoryRow["buyerProfile"]>;
  match: number | null;
}

export interface RankOption {
  id: string;
  title: string;
}

export interface BuyerDirectoryPage {
  buyers: BuyerCardData[];
  total: number;
  page: number;
  pageCount: number;
  rankedFor: RankOption | null;
  rankOptions: RankOption[] | null;
}

function toCard(row: DirectoryRow, match: number | null): BuyerCardData[] {
  const { buyerProfile, ...buyer } = row;
  return buyerProfile ? [{ ...buyer, profile: buyerProfile, match }] : [];
}

function pageCountFor(total: number): number {
  return Math.max(1, Math.ceil(total / BUYERS_PAGE_SIZE));
}

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

export async function getDirectoryCountryOptions(selected: string[]): Promise<CountryOption[]> {
  if (!canBrowseBuyers(await getCurrentUser())) return [];
  const found = await findDirectoryCountries();
  return [...new Set([...found, ...selected])]
    .map((code) => ({ value: code, label: countryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}
