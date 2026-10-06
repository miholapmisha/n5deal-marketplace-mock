import { MAX_AI_QUERY_LENGTH } from "@/lib/ai-search";
import { aiSearchRequestSchema } from "@/server/ai-search/ai-search.schema";
import { aiSearch } from "@/server/ai-search/ai-search.service";

// POST /api/ai-search (SPEC §7) — the app's only route handler. The catalog's AI search box
// posts `{ query }`; the reply is filters for the client to put in the URL, or which keyword
// fallback to show. HTTP concerns stay here; the rules live in the service.

/** A 200-character query is ~0.2 KB of JSON; anything far bigger is not from our form. */
const MAX_BODY_BYTES = 2_048;

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: NO_STORE });
}

/** Vercel sets both headers itself, so a client cannot choose its own IP. Null locally. */
function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("x-real-ip")?.trim() || forwarded || null;
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function POST(request: Request): Promise<Response> {
  // JSON only: a cross-site page cannot send this content type without a CORS preflight,
  // which fails, so other sites cannot spend this app's quota through visitors' browsers.
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse(415, "Send the search as JSON.");
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return errorResponse(413, "Search is too long.");
  }

  const parsed = aiSearchRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse(400, `Enter a search of up to ${MAX_AI_QUERY_LENGTH} characters.`);

  const result = await aiSearch(parsed.data.query, clientIp(request.headers));
  const status = result.mode === "keyword" && result.reason === "rate-limited" ? 429 : 200;
  return Response.json(result, { status, headers: NO_STORE });
}
