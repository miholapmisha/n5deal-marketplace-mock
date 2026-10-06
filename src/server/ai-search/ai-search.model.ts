import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { AI_SEARCH_INSTRUCTION } from "@/server/ai-search/ai-search.prompt";
import { type AiFilters, aiFiltersJsonSchema, aiFiltersSchema } from "@/server/ai-search/ai-search.schema";

export const AI_SEARCH_MODEL = "gemini-3.5-flash-lite";

const TIMEOUT_MS = 5_000;

const MAX_OUTPUT_TOKENS = 512;

let client: GoogleGenAI | null | undefined;

function getClient(): GoogleGenAI | null {
  if (client === undefined) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
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
    console.warn(`[ai-search] model call failed: ${describeError(error)}`);
    return null;
  }
}
