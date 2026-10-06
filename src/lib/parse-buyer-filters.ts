import { BuyerType, Category } from "@/generated/prisma/enums";
import { BUYER_PARAMS, type BuyerFilters, DEFAULT_BUYER_FILTERS, MAX_BUYER_KEYWORDS } from "@/lib/buyer-filters";
import {
  countrySchema,
  enumValueSchema,
  pageSchema,
  parseEuroRange,
  parseMany,
  parseOne,
  type RawSearchParams,
  recordIdSchema,
  searchQuerySchema,
} from "@/lib/search-params";

const categorySchema = enumValueSchema(Category);
const buyerTypeSchema = enumValueSchema(BuyerType);
const querySchema = searchQuerySchema(MAX_BUYER_KEYWORDS);

export function parseBuyerFilters(raw: RawSearchParams): BuyerFilters {
  const [ticketMin, ticketMax] = parseEuroRange(raw, BUYER_PARAMS.ticketMin, BUYER_PARAMS.ticketMax);

  return {
    q: parseOne(raw, BUYER_PARAMS.q, querySchema),
    categories: parseMany(raw, BUYER_PARAMS.categories, categorySchema),
    countries: parseMany(raw, BUYER_PARAMS.countries, countrySchema),
    buyerTypes: parseMany(raw, BUYER_PARAMS.buyerTypes, buyerTypeSchema),
    ticketMin,
    ticketMax,
    rank: parseOne(raw, BUYER_PARAMS.rank, recordIdSchema),
    page: parseOne(raw, BUYER_PARAMS.page, pageSchema) ?? DEFAULT_BUYER_FILTERS.page,
  };
}

export function parseAssetParam(raw: RawSearchParams): string | null {
  return parseOne(raw, "asset", recordIdSchema);
}
