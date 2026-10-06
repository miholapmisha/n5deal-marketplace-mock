import "server-only";

// Keyword search through Prisma `contains` (ILIKE). Good enough for a prototype's few
// hundred rows; Postgres full-text search is on the "with more time" list (SPEC §13).

/** Prisma passes `contains` through to ILIKE; escape its wildcards so "%" means "%". */
function likeLiteral(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Case-insensitive "contains this word" for a Prisma string filter. */
export function containsWord(word: string) {
  return { contains: likeLiteral(word), mode: "insensitive" } as const;
}

/** The search words, at most `max` of them. The URL parser has already collapsed spaces. */
export function searchWords(q: string, max: number): string[] {
  return q.split(" ").slice(0, max);
}
