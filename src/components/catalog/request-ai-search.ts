import { AI_SEARCH_ENDPOINT, type AiSearchResult, FALLBACK_NOTICES } from "@/lib/ai-search";

const CLIENT_TIMEOUT_MS = 10_000;

const UNAVAILABLE: AiSearchResult = { mode: "keyword", reason: "unavailable" };

function isAiSearchResult(value: unknown): value is AiSearchResult {
  if (typeof value !== "object" || value === null) return false;
  const reply = value as Record<string, unknown>;
  if (reply.mode === "ai") return typeof reply.filters === "object" && reply.filters !== null;
  return reply.mode === "keyword" && typeof reply.reason === "string" && Object.hasOwn(FALLBACK_NOTICES, reply.reason);
}

export async function requestAiSearch(query: string): Promise<AiSearchResult> {
  try {
    const response = await fetch(AI_SEARCH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    const reply: unknown = await response.json();
    return isAiSearchResult(reply) ? reply : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}
