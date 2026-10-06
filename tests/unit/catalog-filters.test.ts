import { describe, expect, it } from "vitest";

import {
  catalogHref,
  clearedFilters,
  DEFAULT_CATALOG_FILTERS,
  hasActiveFilters,
  MAX_PRICE_EUR,
  parsePriceInput,
  withFilters,
  withoutValue,
} from "@/lib/catalog-filters";
import { parseCatalogFilters } from "@/lib/parse-catalog-filters";
import type { RawSearchParams } from "@/lib/search-params";

// SPEC §6.6, §9 — the URL is the filter state. Invalid values are dropped, never fatal.

const queryOf = (href: string): RawSearchParams => {
  const params = new URLSearchParams(href.split("?")[1] ?? "");
  const raw: Record<string, string[]> = {};
  for (const [key, value] of params) raw[key] = [...(raw[key] ?? []), value];
  return raw;
};

describe("parseCatalogFilters", () => {
  it("returns the defaults for an empty URL", () => {
    expect(parseCatalogFilters({})).toEqual(DEFAULT_CATALOG_FILTERS);
  });

  it("parses every filter", () => {
    const filters = parseCatalogFilters({
      q: "sepa iban",
      category: ["EMI", "PAYMENT"],
      country: ["LT", "MT"],
      status: "ACTIVE",
      license: "Small EMI",
      regulator: "Bank of Lithuania",
      priceMin: "100000",
      priceMax: "3000000",
      sort: "price-asc",
      page: "2",
    });
    expect(filters).toEqual({
      q: "sepa iban",
      categories: ["EMI", "PAYMENT"],
      countries: ["LT", "MT"],
      businessStatuses: ["ACTIVE"],
      licenseTypes: ["Small EMI"],
      regulators: ["Bank of Lithuania"],
      priceMin: 100_000,
      priceMax: 3_000_000,
      sort: "price-asc",
      page: 2,
    });
  });

  it("swaps a reversed price range", () => {
    const filters = parseCatalogFilters({ priceMin: "900000", priceMax: "100000" });
    expect([filters.priceMin, filters.priceMax]).toEqual([100_000, 900_000]);
  });

  it("ignores unknown categories and countries but keeps the valid ones", () => {
    const filters = parseCatalogFilters({ category: ["EMI", "LOTTERY"], country: ["XX", "EU", "UK", "de"] });
    expect(filters.categories).toEqual(["EMI"]);
    expect(filters.countries).toEqual(["DE"]);
  });

  it("normalizes case and drops duplicates", () => {
    expect(parseCatalogFilters({ category: ["emi", "EMI", " Emi "] }).categories).toEqual(["EMI"]);
  });

  it("drops prices that are not whole euros within the column", () => {
    for (const bad of ["-5", "1.5", "abc", "1e6", String(MAX_PRICE_EUR + 1), "99999999999"]) {
      expect(parseCatalogFilters({ priceMax: bad }).priceMax, bad).toBeNull();
    }
    expect(parseCatalogFilters({ priceMin: "0" }).priceMin).toBeNull();
  });

  it("falls back to the default sort and page on invalid values", () => {
    const filters = parseCatalogFilters({ sort: "cheapest", page: ["0", "-1", "abc"] });
    expect(filters.sort).toBe("newest");
    expect(filters.page).toBe(1);
  });

  it("takes the first valid value of a single-value param", () => {
    expect(parseCatalogFilters({ page: ["x", "3", "4"] }).page).toBe(3);
  });

  it("collapses whitespace in the query and keeps at most six words", () => {
    expect(parseCatalogFilters({ q: "  emi   license  " }).q).toBe("emi license");
    expect(parseCatalogFilters({ q: "a b c d e f g h" }).q).toBe("a b c d e f");
    expect(parseCatalogFilters({ q: "   " }).q).toBeNull();
    expect(parseCatalogFilters({ q: "bad\u0000value" }).q).toBeNull();
  });
});

describe("catalogHref", () => {
  it("omits defaults so equal filters give equal URLs", () => {
    expect(catalogHref(DEFAULT_CATALOG_FILTERS)).toBe("/assets");
  });

  it("round-trips through the parser", () => {
    const filters = {
      ...DEFAULT_CATALOG_FILTERS,
      q: "sepa",
      categories: ["CRYPTO" as const],
      countries: ["EE", "LT"],
      businessStatuses: ["LICENSE_ONLY" as const],
      priceMax: 500_000,
      sort: "best-match" as const,
      page: 3,
    };
    expect(parseCatalogFilters(queryOf(catalogHref(filters)))).toEqual(filters);
  });
});

describe("filter updates", () => {
  const filtered = { ...DEFAULT_CATALOG_FILTERS, categories: ["EMI" as const], countries: ["LT", "MT"], page: 4 };

  it("go back to page 1 on any change except an explicit page", () => {
    expect(withFilters(filtered, { priceMax: 1_000_000 }).page).toBe(1);
    expect(withFilters(filtered, { page: 2 }).page).toBe(2);
  });

  it("remove one value of a multi-value filter", () => {
    expect(withoutValue(filtered, "countries", "LT").countries).toEqual(["MT"]);
    expect(filtered.countries).toEqual(["LT", "MT"]);
  });

  it("reset everything but the sort", () => {
    const cleared = clearedFilters({ ...filtered, sort: "price-desc" });
    expect(cleared).toEqual({ ...DEFAULT_CATALOG_FILTERS, sort: "price-desc" });
    expect(hasActiveFilters(cleared)).toBe(false);
    expect(hasActiveFilters(filtered)).toBe(true);
  });
});

describe("parsePriceInput", () => {
  it("accepts plain digits and grouped thousands", () => {
    expect(parsePriceInput("500000")).toBe(500_000);
    expect(parsePriceInput(" 500 000 ")).toBe(500_000);
    expect(parsePriceInput("1,500,000")).toBe(1_500_000);
    expect(parsePriceInput("1.500.000")).toBe(1_500_000);
  });

  it("rejects decimals, negatives, words, and values past the column", () => {
    for (const bad of ["1.5", "-100", "500k", "", "50,00", "9999999999"]) {
      expect(parsePriceInput(bad), bad).toBeNull();
    }
  });
});
