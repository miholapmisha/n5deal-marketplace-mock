import { describe, expect, it } from "vitest";

import { inRankedOrder, rankBy, rankedPage } from "@/server/matching/rank";

interface Row {
  id: string;
  score: number;
  at: Date | null;
}

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

const rows: Row[] = [
  { id: "c", score: 70, at: day(1) },
  { id: "a", score: 90, at: day(1) },
  { id: "d", score: 70, at: day(5) },
  { id: "b", score: 70, at: day(5) },
  { id: "e", score: 70, at: null },
];

const ranked = rankBy(
  rows,
  (row) => row.score,
  (row) => row.at,
);

describe("rankBy", () => {
  it("sorts by score, then most recent, then id", () => {
    expect(ranked.map((row) => row.id)).toEqual(["a", "b", "d", "c", "e"]);
  });

  it("keeps the scores and leaves the input untouched", () => {
    expect(ranked[0]).toEqual({ id: "a", score: 90 });
    expect(rows.map((row) => row.id)).toEqual(["c", "a", "d", "b", "e"]);
  });
});

describe("rankedPage", () => {
  it("slices 1-based pages", () => {
    expect(rankedPage(ranked, 1, 2).map((row) => row.id)).toEqual(["a", "b"]);
    expect(rankedPage(ranked, 3, 2).map((row) => row.id)).toEqual(["e"]);
    expect(rankedPage(ranked, 4, 2)).toEqual([]);
  });
});

describe("inRankedOrder", () => {
  it("puts rows loaded by id back in ranking order and skips vanished ones", () => {
    const loaded = [{ id: "d" }, { id: "a" }, { id: "b" }];
    expect(inRankedOrder(loaded, ranked).map((row) => row.id)).toEqual(["a", "b", "d"]);
  });
});
