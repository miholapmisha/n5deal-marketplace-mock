import "server-only";

import type { BusinessStatus, Category, StatusPref } from "@/generated/prisma/client";

// SPEC §4.4 — how well an asset fits a buyer's acquisition profile, 0–100. Pure, and the
// only implementation: "match %" on asset cards (buyer → asset) and "Rank for" in the buyer
// directory (seller → buyers) both call it.

export interface MatchAsset {
  category: Category;
  country: string;
  /** Whole euros; null = price on request. */
  priceEur: number | null;
  businessStatus: BusinessStatus;
}

export interface MatchProfile {
  /** Empty = any category. */
  categories: Category[];
  /** Empty = any country. */
  countries: string[];
  ticketMinEur: number | null;
  ticketMaxEur: number | null;
  statusPref: StatusPref;
}

/** Points per signal. They add up to 100. */
export const MATCH_POINTS = {
  category: { hit: 40, any: 20 },
  country: { hit: 25, any: 15 },
  price: { inside: 25, near: 10, unknown: 12 },
  status: { hit: 10 },
} as const;

export const MATCH_SIGNAL_MAX = {
  category: MATCH_POINTS.category.hit,
  country: MATCH_POINTS.country.hit,
  price: MATCH_POINTS.price.inside,
  status: MATCH_POINTS.status.hit,
} as const;

export type MatchSignal = keyof typeof MATCH_SIGNAL_MAX;
export type MatchSignals = Record<MatchSignal, number>;

function listPoints<T>(value: T, wanted: readonly T[], points: { hit: number; any: number }): number {
  if (wanted.length === 0) return points.any;
  return wanted.includes(value) ? points.hit : 0;
}

/**
 * Inside the ticket → full points; within 20% outside it → partial; price on request or no
 * ticket → neutral. A ticket with one bound is open on the other side. The 20% band is
 * checked in integers (5·price vs 4·min, 6·max) so no float rounding moves a boundary.
 */
function pricePoints(price: number | null, min: number | null, max: number | null): number {
  const { inside, near, unknown } = MATCH_POINTS.price;
  if (price === null || (min === null && max === null)) return unknown;
  if (min !== null && price < min) return price * 5 >= min * 4 ? near : 0;
  if (max !== null && price > max) return price * 5 <= max * 6 ? near : 0;
  return inside;
}

/** The score split by signal, e.g. to explain a match on the buyer detail page. */
export function matchSignals(asset: MatchAsset, profile: MatchProfile): MatchSignals {
  return {
    category: listPoints(asset.category, profile.categories, MATCH_POINTS.category),
    country: listPoints(asset.country, profile.countries, MATCH_POINTS.country),
    price: pricePoints(asset.priceEur, profile.ticketMinEur, profile.ticketMaxEur),
    status:
      profile.statusPref === "ANY" || profile.statusPref === asset.businessStatus ? MATCH_POINTS.status.hit : 0,
  };
}

export function matchScore(asset: MatchAsset, profile: MatchProfile): number {
  const signals = matchSignals(asset, profile);
  return signals.category + signals.country + signals.price + signals.status;
}
