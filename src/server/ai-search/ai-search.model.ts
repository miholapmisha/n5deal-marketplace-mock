import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { AI_SEARCH_INSTRUCTION } from "@/server/ai-search/ai-search.prompt";
import { type AiFilters, aiFiltersJsonSchema, aiFiltersSchema } from "@/server/ai-search/ai-search.schema";

// The one place that talks to the model (SPEC §7): switching provider means rewriting this
// file only. Gemini's structured output takes a JSON schema and replies with matching JSON,
// which Zod then checks again — the schema is a request to the model, not a guarantee.

/** Pinned rather than `gemini-flash-lite-latest`, so behaviour changes only with the code. */
export const AI_SEARCH_MODEL = "gemini-3.5-flash-lite";

/**
 * Enforced in the client: Gemini's own `httpOptions.timeout` becomes a server deadline,
 * which the API refuses below 10 s.
 */
const TIMEOUT_MS = 5_000;

/** A filter object is ~100 tokens; the cap ends a runaway reply early. */
const MAX_OUTPUT_TOKENS = 512;

let client: GoogleGenAI | null | undefined;

/** Created on first use; null when no key is configured. */
function getClient(): GoogleGenAI | null {
  if (client === undefined) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    // No retries: a 429 means the free quota is spent, and the budget is 5 s anyway.
    client = apiKey ? new GoogleGenAI({ apiKey, httpOptions: { retryOptions: { attempts: 1 } } }) : null;
  }
  return client;
}

export function isAiSearchConfigured(): boolean {
  return getClient() !== null;
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * The query as filters, or null when the model cannot be used: no key, an API error (an
 * exhausted quota included), the timeout, or a reply that is not valid filter JSON.
 */
export async function interpretQuery(query: string, licenseTypes: readonly string[]): Promise<AiFilters | null> {
  const ai = getClient();
  if (!ai) return null;

  const schema = aiFiltersSchema(licenseTypes);
  try {
    const response = await ai.models.generateContent({
      model: AI_SEARCH_MODEL,
      contents: query,
      config: {
        systemInstruction: AI_SEARCH_INSTRUCTION,
        temperature: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
        responseJsonSchema: aiFiltersJsonSchema(schema),
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });

    const parsed = schema.safeParse(JSON.parse(response.text ?? ""));
    if (parsed.success) return parsed.data;
    console.warn(`[ai-search] invalid model reply:\n${z.prettifyError(parsed.error)}`);
    return null;
  } catch (error) {
    // The query is not logged: it is the visitor's text.
    console.warn(`[ai-search] model call failed: ${describeError(error)}`);
    return null;
  }
}
