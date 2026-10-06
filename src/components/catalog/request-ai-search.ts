import { AI_SEARCH_ENDPOINT, type AiSearchResult, FALLBACK_NOTICES } from "@/lib/ai-search";

/** The server gives up on the model after 5 s; this only covers a connection that hangs. */
const CLIENT_TIMEOUT_MS = 10_000;

const UNAVAILABLE: AiSearchResult = { mode: "keyword", reason: "unavailable" };

/** Enough of a shape check to use the reply without trusting it blindly. */
function isAiSearchResult(value: unknown): value is AiSearchResult {
  if (typeof value !== "object" || value === null) return false;
  const reply = value as Record<string, unknown>;
  if (reply.mode === "ai") return typeof reply.filters === "object" && reply.filters !== null;
  return reply.mode === "keyword" && typeof reply.reason === "string" && Object.hasOwn(FALLBACK_NOTICES, reply.reason);
}

/**
 * Asks the server to interpret the query (SPEC §7). Never throws: a network error, an error
 * status, or an unexpected reply all mean "unavailable", which falls back to keywords.
 */
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
