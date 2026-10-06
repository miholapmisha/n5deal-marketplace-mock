import { z } from "zod";

import { BusinessStatus, Category } from "@/generated/prisma/enums";
import {
  CATALOG_PARAMS,
  CATALOG_SORTS,
  type CatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  MAX_KEYWORDS,
  MAX_PRICE_EUR,
} from "@/lib/catalog-filters";
import { isCountryCode } from "@/lib/countries";

// URL → CatalogFilters (SPEC §6.6, §9). Every value is validated on its own and invalid
// ones are dropped, so a hand-edited or stale link degrades to "fewer filters", never to an
// error page. Kept apart from catalog-filters.ts so Zod stays out of the client bundle.

export type RawSearchParams = Record<string, string | string[] | undefined>;

const MAX_VALUES_PER_PARAM = 20;
const MAX_QUERY_LENGTH = 100;
const MAX_TEXT_VALUE_LENGTH = 80;
const MAX_PAGE = 10_000;

const NO_CONTROL_CHARS = /^[^\u0000-\u001f\u007f]*$/;

const categorySchema = z.string().trim().toUpperCase().pipe(z.enum(Category));
const businessStatusSchema = z.string().trim().toUpperCase().pipe(z.enum(BusinessStatus));
const countrySchema = z.string().trim().toUpperCase().refine(isCountryCode);
/** License types and regulators are free text in the data ("Banking (CRR)", "PRA / FCA"). */
const textValueSchema = z.string().trim().min(1).max(MAX_TEXT_VALUE_LENGTH).regex(NO_CONTROL_CHARS);
const priceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,10}$/)
  .transform(Number)
  .pipe(z.int().max(MAX_PRICE_EUR));
const pageSchema = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/)
  .transform(Number)
  .pipe(z.int().min(1).max(MAX_PAGE));
const sortSchema = z.enum(CATALOG_SORTS);
/** Whitespace collapsed; overlong text is cut (to what is searched) rather than discarded. */
const querySchema = z
  .string()
  .transform((value) =>
    value.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).split(" ").slice(0, MAX_KEYWORDS).join(" ").trim(),
  )
  .pipe(z.string().min(1).regex(NO_CONTROL_CHARS));

function rawValues(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** The first valid occurrence wins for single-value params (`?page=x&page=2` → 2). */
function parseOne<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T | null {
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
  }
  return null;
}

/** Valid values only, de-duplicated, in URL order, capped so a URL cannot fan out a query. */
function parseMany<T>(raw: RawSearchParams, key: string, schema: z.ZodType<T>): T[] {
  const values = new Set<T>();
  for (const value of rawValues(raw, key)) {
    const parsed = schema.safeParse(value);
    if (parsed.success) values.add(parsed.data);
    if (values.size === MAX_VALUES_PER_PARAM) break;
  }
  return [...values];
}

export function parseCatalogFilters(raw: RawSearchParams): CatalogFilters {
  // A minimum of €0 is no bound at all; keeping it would silently hide "price on request".
  const min = parseOne(raw, CATALOG_PARAMS.priceMin, priceSchema) || null;
  const max = parseOne(raw, CATALOG_PARAMS.priceMax, priceSchema);
  // SPEC §9: a reversed range is a typo, not an empty result.
  const reversed = min !== null && max !== null && min > max;

  return {
    q: parseOne(raw, CATALOG_PARAMS.q, querySchema),
    categories: parseMany(raw, CATALOG_PARAMS.categories, categorySchema),
    countries: parseMany(raw, CATALOG_PARAMS.countries, countrySchema),
    businessStatuses: parseMany(raw, CATALOG_PARAMS.businessStatuses, businessStatusSchema),
    licenseTypes: parseMany(raw, CATALOG_PARAMS.licenseTypes, textValueSchema),
    regulators: parseMany(raw, CATALOG_PARAMS.regulators, textValueSchema),
    priceMin: reversed ? max : min,
    priceMax: reversed ? min : max,
    sort: parseOne(raw, CATALOG_PARAMS.sort, sortSchema) ?? DEFAULT_CATALOG_FILTERS.sort,
    page: parseOne(raw, CATALOG_PARAMS.page, pageSchema) ?? DEFAULT_CATALOG_FILTERS.page,
  };
}
