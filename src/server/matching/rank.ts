import "server-only";

export const MAX_RANKED_ROWS = 1000;

export interface Ranked {
  id: string;
  score: number;
}

interface RankInput {
  id: string;
  score: number;
  recency: Date | null;
}

function compareRanked(a: RankInput, b: RankInput): number {
  return (
    b.score - a.score ||
    (b.recency?.getTime() ?? 0) - (a.recency?.getTime() ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export function rankBy<T extends { id: string }>(
  items: readonly T[],
  score: (item: T) => number,
  recency: (item: T) => Date | null,
): Ranked[] {
  return items
    .map((item) => ({ id: item.id, score: score(item), recency: recency(item) }))
    .sort(compareRanked)
    .map(({ id, score: points }) => ({ id, score: points }));
}

export function rankedPage(ranked: readonly Ranked[], page: number, pageSize: number): Ranked[] {
  return ranked.slice((page - 1) * pageSize, page * pageSize);
}

export function inRankedOrder<T extends { id: string }>(rows: readonly T[], ranked: readonly Ranked[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ranked.flatMap(({ id }) => byId.get(id) ?? []);
}
