import "server-only";

function likeLiteral(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function containsWord(word: string) {
  return { contains: likeLiteral(word), mode: "insensitive" } as const;
}

export function searchWords(q: string, max: number): string[] {
  return q.split(" ").slice(0, max);
}
