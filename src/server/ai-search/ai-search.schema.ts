import "server-only";

import { z } from "zod";

import { BusinessStatus, Category } from "@/generated/prisma/enums";
import { MAX_AI_QUERY_LENGTH } from "@/lib/ai-search";
import { MAX_PRICE_EUR } from "@/lib/catalog-filters";
import { REGION_KEYS } from "@/lib/regions";
import { NO_CONTROL_CHARS } from "@/lib/search-params";

export const aiSearchRequestSchema = z.object({
  query: z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(MAX_AI_QUERY_LENGTH).regex(NO_CONTROL_CHARS)),
});

const MAX_COUNTRIES = 40;

const euros = z.int().min(0).max(MAX_PRICE_EUR);

export function aiFiltersSchema(licenseTypes: readonly string[]) {
  const licenseType: z.ZodType<string> =
    licenseTypes.length > 0 ? z.enum(licenseTypes as [string, ...string[]]) : z.string();

  return z.object({
    categories: z
      .array(z.enum(Category))
      .max(Object.keys(Category).length)
      .optional()
      .describe("Asset categories the buyer asks for."),
    regions: z
      .array(z.enum(REGION_KEYS))
      .max(REGION_KEYS.length)
      .optional()
      .describe("Regions named in the text. Do not also list their countries."),
    countries: z
      .array(z.string())
      .max(MAX_COUNTRIES)
      .optional()
      .describe("ISO 3166-1 alpha-2 codes, upper case, for countries named one by one."),
    priceMinEur: euros.optional().describe("Lowest asking price, whole euros."),
    priceMaxEur: euros.optional().describe("Highest asking price, whole euros."),
    businessStatus: z
      .array(z.enum(BusinessStatus))
      .max(Object.keys(BusinessStatus).length)
      .optional()
      .describe("ACTIVE = operating business, LICENSE_ONLY = license without operations."),
    licenseTypes: z
      .array(licenseType)
      .max(licenseTypes.length)
      .optional()
      .describe("Specific license types, only when narrower than the category."),
    keywords: z.string().optional().describe("Up to 3 words a listing must contain that fit no other field."),
  });
}

export type AiFilters = z.infer<ReturnType<typeof aiFiltersSchema>>;

export function aiFiltersJsonSchema(schema: ReturnType<typeof aiFiltersSchema>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(z.toJSONSchema(schema)).filter(([key]) => key !== "$schema"));
}
