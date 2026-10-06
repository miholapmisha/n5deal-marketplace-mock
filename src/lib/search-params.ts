import { z } from "zod";

import { MAX_PRICE_EUR } from "@/lib/catalog-filters";
import { isCountryCode } from "@/lib/countries";

// Building blocks for turning a query string into filters (SPEC §6.6, §9): every value is
// validated on its own and invalid ones are dropped, so a hand-edited or stale link degrades
// to "fewer filters", never to an error page. Server-side only in practice (Zod stays out of
// the client bundle), but pure.

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_VALUES_PER_PARAM = 20;
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;

export const NO_CONTROL_CHARS = /^[^\u0000-\u001f\u007f]*$/;

/** "emi " → "EMI" if it names a member of the enum. */
export function enumValueSchema<const T extends Record<string, string>>(values: T) {
  return z.string().trim().toUpperCase().pipe(z.enum(values));
}

export const countrySchema = z.string().trim().toUpperCase().refine(isCountryCode);

/** Record IDs: cuids in production, readable IDs in the seed (`ast_101`, `conv_demo_lt_emi`). */
export const recordIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{1,64}$/i);

/** Whole euros as digits, within the Int column. */
export const euroSchema = z
  .string()
  .trim()
  .regex(/^\d{1,10}$/)
  .transform(Number)
  .pipe(z.int().max(MAX_PRICE_EUR));

export const pageSchema = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/)
  .transform(Number)
  .pipe(z.int().min(1).max(MAX_PAGE));

/** Whitespace collapsed; overlong text is cut (to what is searched) rather than discarded. */
export function searchQuerySchema(maxWords: number) {
  return z
    .string()
    .transform((value) =>
      value.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).split(" ").slice(0, maxWords).join(" ").trim(),
    )
    .pipe(z.string().min(1).regex(NO_CONTROL_CHARS));
}

function rawValues(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** The first valid occurrence wins for single-value params (`?page=x&page=2` → 2). */
export function parseOne<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T | null {
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
  }
  return null;
}

/** Valid values only, de-duplicated, in URL order, capped so a URL cannot fan out a query. */
export function parseMany<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T[] {
  const values = new Set<T>();
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) values.add(parsed.data);
    if (values.size === MAX_VALUES_PER_PARAM) break;
  }
  return [...values];
}

/**
 * Two euro bounds from the URL. A minimum of €0 is no bound at all, and a reversed range is
 * a typo, not an empty result (SPEC §9): the values are swapped.
 */
export function parseEuroRange(raw: RawSearchParams, minKey: string, maxKey: string): [number | null, number | null] {
  const min = parseOne(raw, minKey, euroSchema) || null;
  const max = parseOne(raw, maxKey, euroSchema);
  return min !== null && max !== null && min > max ? [max, min] : [min, max];
}
