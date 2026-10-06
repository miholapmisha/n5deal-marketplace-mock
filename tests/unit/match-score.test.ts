import { describe, expect, it } from "vitest";

import {
  MATCH_SIGNAL_MAX,
  type MatchAsset,
  type MatchProfile,
  matchScore,
  matchSignals,
} from "@/server/matching/match-score";

// SPEC §4.4: category 40 · country 25 · price vs ticket 25 · business status 10.

const asset: MatchAsset = { category: "EMI", country: "LT", priceEur: 1_000_000, businessStatus: "ACTIVE" };

/** A buyer with no preferences at all. */
const openProfile: MatchProfile = {
  categories: [],
  countries: [],
  ticketMinEur: null,
  ticketMaxEur: null,
  statusPref: "ANY",
};

const profile = (patch: Partial<MatchProfile>): MatchProfile => ({ ...openProfile, ...patch });
const pricePoints = (priceEur: number | null, ticket: Partial<MatchProfile>) =>
  matchSignals({ ...asset, priceEur }, profile(ticket)).price;

describe("matchScore", () => {
  it("has signals that add up to 100", () => {
    const max = Object.values(MATCH_SIGNAL_MAX).reduce((sum, points) => sum + points, 0);
    expect(max).toBe(100);
  });

  it("gives 100 for a perfect fit", () => {
    const perfect = profile({
      categories: ["EMI"],
      countries: ["LT"],
      ticketMinEur: 500_000,
      ticketMaxEur: 2_000_000,
      statusPref: "ACTIVE",
    });
    expect(matchScore(asset, perfect)).toBe(100);
  });

  it("gives neutral points to a buyer with no preferences", () => {
    expect(matchSignals(asset, openProfile)).toEqual({ category: 20, country: 15, price: 12, status: 10 });
    expect(matchScore(asset, openProfile)).toBe(57);
  });

  it("gives nothing for a category or country the buyer does not want", () => {
    const signals = matchSignals(asset, profile({ categories: ["BANK", "CRYPTO"], countries: ["MT"] }));
    expect(signals.category).toBe(0);
    expect(signals.country).toBe(0);
  });

  it("matches the business status preference", () => {
    expect(matchSignals(asset, profile({ statusPref: "ACTIVE" })).status).toBe(10);
    expect(matchSignals(asset, profile({ statusPref: "LICENSE_ONLY" })).status).toBe(0);
    expect(matchSignals({ ...asset, businessStatus: "LICENSE_ONLY" }, profile({ statusPref: "ANY" })).status).toBe(10);
  });

  it("is the sum of its signals", () => {
    const mixed = profile({ categories: ["EMI"], countries: ["MT"], ticketMaxEur: 900_000, statusPref: "LICENSE_ONLY" });
    const signals = matchSignals(asset, mixed);
    expect(matchScore(asset, mixed)).toBe(signals.category + signals.country + signals.price + signals.status);
    expect(matchScore(asset, mixed)).toBe(40 + 0 + 10 + 0);
  });
});

describe("matchScore price signal", () => {
  const ticket = { ticketMinEur: 500_000, ticketMaxEur: 1_000_000 };

  it("is neutral for price on request or a buyer without a ticket", () => {
    expect(pricePoints(null, ticket)).toBe(12);
    expect(pricePoints(1_000_000, {})).toBe(12);
  });

  it("gives full points inside the ticket, bounds included", () => {
    expect(pricePoints(500_000, ticket)).toBe(25);
    expect(pricePoints(750_000, ticket)).toBe(25);
    expect(pricePoints(1_000_000, ticket)).toBe(25);
  });

  it("gives partial points within 20% below the minimum, inclusive", () => {
    expect(pricePoints(400_000, ticket)).toBe(10);
    expect(pricePoints(499_999, ticket)).toBe(10);
    expect(pricePoints(399_999, ticket)).toBe(0);
  });

  it("gives partial points within 20% above the maximum, inclusive", () => {
    expect(pricePoints(1_000_001, ticket)).toBe(10);
    expect(pricePoints(1_200_000, ticket)).toBe(10);
    expect(pricePoints(1_200_001, ticket)).toBe(0);
  });

  it("treats a ticket with one bound as open on the other side", () => {
    expect(pricePoints(25_000_000, { ticketMinEur: 500_000 })).toBe(25);
    expect(pricePoints(400_000, { ticketMinEur: 500_000 })).toBe(10);
    expect(pricePoints(50_000, { ticketMaxEur: 1_000_000 })).toBe(25);
    expect(pricePoints(1_200_001, { ticketMaxEur: 1_000_000 })).toBe(0);
  });

  it("checks the 20% band exactly where floats would round", () => {
    // 0.8 × 333,333 = 266,666.4: 266,667 is inside the band, 266,666 is not.
    expect(pricePoints(266_667, { ticketMinEur: 333_333 })).toBe(10);
    expect(pricePoints(266_666, { ticketMinEur: 333_333 })).toBe(0);
    // 1.2 × 333,333 = 399,999.6: 399,999 is inside the band, 400,000 is not.
    expect(pricePoints(399_999, { ticketMaxEur: 333_333 })).toBe(10);
    expect(pricePoints(400_000, { ticketMaxEur: 333_333 })).toBe(0);
  });
});
