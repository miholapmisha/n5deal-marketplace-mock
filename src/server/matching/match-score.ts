import "server-only";

import type { BusinessStatus, Category, StatusPref } from "@/generated/prisma/client";

export interface MatchAsset {
  category: Category;
  country: string;
  priceEur: number | null;
  businessStatus: BusinessStatus;
}

export interface MatchProfile {
  categories: Category[];
  countries: string[];
  ticketMinEur: number | null;
  ticketMaxEur: number | null;
  statusPref: StatusPref;
}

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

function pricePoints(price: number | null, min: number | null, max: number | null): number {
  const { inside, near, unknown } = MATCH_POINTS.price;
  if (price === null || (min === null && max === null)) return unknown;
  if (min !== null && price < min) return price * 5 >= min * 4 ? near : 0;
  if (max !== null && price > max) return price * 5 <= max * 6 ? near : 0;
  return inside;
}

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
