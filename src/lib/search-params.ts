import { z } from "zod";

import { MAX_PRICE_EUR } from "@/lib/catalog-filters";
import { isCountryCode } from "@/lib/countries";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_VALUES_PER_PARAM = 40;
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;

export const NO_CONTROL_CHARS = /^[^\u0000-\u001f\u007f]*$/;

export function enumValueSchema<const T extends Record<string, string>>(values: T) {
  return z.string().trim().toUpperCase().pipe(z.enum(values));
}

export const countrySchema = z.string().trim().toUpperCase().refine(isCountryCode);

export const recordIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{1,64}$/i);

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

export function parseOne<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T | null {
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
  }
  return null;
}

export function parseMany<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T[] {
  const values = new Set<T>();
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) values.add(parsed.data);
    if (values.size === MAX_VALUES_PER_PARAM) break;
  }
  return [...values];
}

export function parseEuroRange(raw: RawSearchParams, minKey: string, maxKey: string): [number | null, number | null] {
  const min = parseOne(raw, minKey, euroSchema) || null;
  const max = parseOne(raw, maxKey, euroSchema);
  return min !== null && max !== null && min > max ? [max, min] : [min, max];
}
