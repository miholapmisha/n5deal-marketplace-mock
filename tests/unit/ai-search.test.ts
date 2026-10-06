import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestAiSearch } from "@/components/catalog/request-ai-search";
import { REGIONS } from "@/lib/regions";
import { toSearchFilters } from "@/server/ai-search/ai-filters";
import { interpretQuery, isAiSearchConfigured } from "@/server/ai-search/ai-search.model";
import { deleteSearchCountsBefore, incrementSearchCount } from "@/server/ai-search/ai-search.repo";
import { aiFiltersJsonSchema, aiFiltersSchema, aiSearchRequestSchema } from "@/server/ai-search/ai-search.schema";
import { AI_SEARCHES_PER_HOUR, aiSearch } from "@/server/ai-search/ai-search.service";
import { getCurrentUser } from "@/server/auth/session";

// SPEC §7 — what the model may answer, how an answer becomes filters, and the keyword
// fallback at every step that can fail. The model, the counter table, and the session are
// mocked: no API key or database is needed.

vi.mock("@/server/ai-search/ai-search.model", () => ({ interpretQuery: vi.fn(), isAiSearchConfigured: vi.fn() }));
vi.mock("@/server/ai-search/ai-search.repo", () => ({ incrementSearchCount: vi.fn(), deleteSearchCountsBefore: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/assets/asset.service", () => ({ listCatalogLicenseTypes: vi.fn(async () => LICENSE_TYPES) }));

const { LICENSE_TYPES } = vi.hoisted(() => ({ LICENSE_TYPES: ["Small EMI", "EMI", "CASP"] }));

describe("aiSearchRequestSchema", () => {
  it("collapses whitespace and limits the query to 200 characters", () => {
    expect(aiSearchRequestSchema.parse({ query: "  emi \n in   the EU " })).toEqual({ query: "emi in the EU" });
    expect(aiSearchRequestSchema.safeParse({ query: "   " }).success).toBe(false);
    expect(aiSearchRequestSchema.safeParse({ query: "x".repeat(201) }).success).toBe(false);
    expect(aiSearchRequestSchema.safeParse({ query: 42 }).success).toBe(false);
  });
});

describe("aiFiltersSchema", () => {
  const schema = aiFiltersSchema(LICENSE_TYPES);

  it("accepts a full, valid reply and an empty one", () => {
    const reply = {
      categories: ["EMI"],
      regions: ["EU"],
      countries: ["GB"],
      priceMinEur: 100_000,
      priceMaxEur: 3_000_000,
      businessStatus: ["ACTIVE"],
      licenseTypes: ["Small EMI"],
      keywords: "SEPA",
    };
    expect(schema.parse(reply)).toEqual(reply);
    expect(schema.parse({})).toEqual({});
  });

  it("rejects values outside the enums and negative or fractional prices", () => {
    expect(schema.safeParse({ categories: ["LOTTERY"] }).success).toBe(false);
    expect(schema.safeParse({ regions: ["ASIA"] }).success).toBe(false);
    expect(schema.safeParse({ licenseTypes: ["Banking license"] }).success).toBe(false);
    expect(schema.safeParse({ priceMaxEur: -1 }).success).toBe(false);
    expect(schema.safeParse({ priceMaxEur: 1.5 }).success).toBe(false);
  });

  it("allows no license type when the catalog has none", () => {
    const empty = aiFiltersSchema([]);
    expect(empty.safeParse({ licenseTypes: [] }).success).toBe(true);
    expect(empty.safeParse({ licenseTypes: ["EMI"] }).success).toBe(false);
  });

  it("becomes a JSON schema Gemini accepts: no $schema, enums inline", () => {
    const json = aiFiltersJsonSchema(schema);
    expect(json).not.toHaveProperty("$schema");
    expect(json).toMatchObject({
      type: "object",
      properties: { licenseTypes: { items: { enum: LICENSE_TYPES } } },
    });
  });
});

describe("toSearchFilters", () => {
  it("expands regions in code and merges named countries", () => {
    const filters = toSearchFilters({ regions: ["BALTICS"], countries: ["GB", "LT"] });
    expect(filters.countries).toEqual(["EE", "LV", "LT", "GB"]);
    expect(toSearchFilters({ regions: ["EU"] }).countries).toEqual([...REGIONS.EU]);
  });

  it("holds the reply to the URL's rules", () => {
    const filters = toSearchFilters({
      countries: ["XX", "mt"],
      priceMinEur: 900_000,
      priceMaxEur: 100_000,
      keywords: "  MFSA  ",
    });
    expect(filters).toMatchObject({ countries: ["MT"], priceMin: 100_000, priceMax: 900_000, q: "MFSA" });
  });

  it("never carries a sort or page", () => {
    expect(toSearchFilters({ categories: ["BANK"] })).not.toHaveProperty("sort");
    expect(toSearchFilters({ categories: ["BANK"] })).not.toHaveProperty("page");
  });
});

describe("aiSearch fallback", () => {
  beforeEach(() => {
    vi.mocked(isAiSearchConfigured).mockReturnValue(true);
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(incrementSearchCount).mockResolvedValue(2);
    vi.mocked(interpretQuery).mockResolvedValue({ categories: ["EMI"], regions: ["EU"] });
  });

  it("returns filters when the model answers with some", async () => {
    const result = await aiSearch("emi in the eu", "203.0.113.7");
    expect(result).toMatchObject({ mode: "ai", filters: { categories: ["EMI"] } });
    expect(interpretQuery).toHaveBeenCalledWith("emi in the eu", LICENSE_TYPES);
  });

  it("falls back without a key, and counts nothing", async () => {
    vi.mocked(isAiSearchConfigured).mockReturnValue(false);
    expect(await aiSearch("emi", null)).toEqual({ mode: "keyword", reason: "unavailable" });
    expect(incrementSearchCount).not.toHaveBeenCalled();
  });

  it("falls back when the model fails or times out", async () => {
    vi.mocked(interpretQuery).mockResolvedValue(null);
    expect(await aiSearch("emi", null)).toEqual({ mode: "keyword", reason: "unavailable" });
  });

  it("falls back when the reply holds no filters", async () => {
    vi.mocked(interpretQuery).mockResolvedValue({});
    expect(await aiSearch("hello there", null)).toEqual({ mode: "keyword", reason: "no-filters" });
  });

  it("stops calling the model past the hourly limit", async () => {
    vi.mocked(incrementSearchCount).mockResolvedValue(AI_SEARCHES_PER_HOUR);
    expect((await aiSearch("emi", null)).mode).toBe("ai");

    vi.mocked(interpretQuery).mockClear();
    vi.mocked(incrementSearchCount).mockResolvedValue(AI_SEARCHES_PER_HOUR + 1);
    expect(await aiSearch("emi", null)).toEqual({ mode: "keyword", reason: "rate-limited" });
    expect(interpretQuery).not.toHaveBeenCalled();
  });

  it("counts per account when logged in, per hashed IP otherwise", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "usr_buyer",
      name: "B",
      email: "b@example.com",
      companyName: null,
      role: "BUYER",
    });
    await aiSearch("emi", "203.0.113.7");
    expect(vi.mocked(incrementSearchCount).mock.lastCall?.[0]).toBe("user:usr_buyer");

    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await aiSearch("emi", "203.0.113.7");
    const key = vi.mocked(incrementSearchCount).mock.lastCall?.[0];
    expect(key).toMatch(/^ip:[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
  });

  it("uses fixed one-hour windows and prunes old ones on a window's first search", async () => {
    vi.mocked(incrementSearchCount).mockResolvedValue(1);
    await aiSearch("emi", null);
    const windowStart = vi.mocked(incrementSearchCount).mock.lastCall?.[1] ?? new Date(NaN);
    expect(windowStart.getTime() % (60 * 60 * 1000)).toBe(0);
    expect(deleteSearchCountsBefore).toHaveBeenCalledWith(windowStart);
  });
});

describe("requestAiSearch (client)", () => {
  const reply = (body: unknown, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

  it("passes a valid reply through, the 429 fallback included", async () => {
    vi.stubGlobal("fetch", reply({ mode: "ai", filters: { categories: ["EMI"] } }));
    expect(await requestAiSearch("emi")).toEqual({ mode: "ai", filters: { categories: ["EMI"] } });

    vi.stubGlobal("fetch", reply({ mode: "keyword", reason: "rate-limited" }, 429));
    expect(await requestAiSearch("emi")).toEqual({ mode: "keyword", reason: "rate-limited" });
  });

  it("treats network errors and unexpected replies as unavailable", async () => {
    const unavailable = { mode: "keyword", reason: "unavailable" };

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    expect(await requestAiSearch("emi")).toEqual(unavailable);

    vi.stubGlobal("fetch", reply({ error: "Enter a search of up to 200 characters." }, 400));
    expect(await requestAiSearch("emi")).toEqual(unavailable);

    vi.stubGlobal("fetch", reply({ mode: "keyword", reason: "made-up" }));
    expect(await requestAiSearch("emi")).toEqual(unavailable);
  });
});
