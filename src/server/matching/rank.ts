import "server-only";

// Sorting by match score (SPEC §4.4). The score is computed in TypeScript, so ranking cannot
// happen in SQL: the service fetches the scoring fields of every matching row, ranks them
// here, and then loads only the visible page in full. The cap bounds that first query; past
// it, the ranking covers the most recent rows.

export const MAX_RANKED_ROWS = 1000;

export interface Ranked {
  id: string;
  score: number;
}

interface RankInput {
  id: string;
  score: number;
  /** Tie-breaker: more recent first. */
  recency: Date | null;
}

/** Best score first; ties go to the most recent, then to the id (stable pagination). */
function compareRanked(a: RankInput, b: RankInput): number {
  return (
    b.score - a.score ||
    (b.recency?.getTime() ?? 0) - (a.recency?.getTime() ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** Scores every item and returns them best first. Does not touch the input array. */
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

/** One page (1-based) of a ranked list. */
export function rankedPage(ranked: readonly Ranked[], page: number, pageSize: number): Ranked[] {
  return ranked.slice((page - 1) * pageSize, page * pageSize);
}

/**
 * Rows loaded by id come back in any order: put them in ranking order. A row that vanished
 * between the two queries (unpublished, suspended) is simply left out.
 */
export function inRankedOrder<T extends { id: string }>(rows: readonly T[], ranked: readonly Ranked[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ranked.flatMap(({ id }) => byId.get(id) ?? []);
}
