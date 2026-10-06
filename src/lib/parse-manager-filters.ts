import { AssetStatus, Category, UserStatus } from "@/generated/prisma/enums";
import {
  DEFAULT_MANAGER_ASSET_FILTERS,
  DEFAULT_PARTICIPANT_FILTERS,
  type ManagerAssetFilters,
  MAX_MANAGER_KEYWORDS,
  type ParticipantFilters,
} from "@/lib/manager-filters";
import {
  countrySchema,
  enumValueSchema,
  pageSchema,
  parseOne,
  type RawSearchParams,
  recordIdSchema,
  searchQuerySchema,
} from "@/lib/search-params";

const querySchema = searchQuerySchema(MAX_MANAGER_KEYWORDS);
const roleSchema = enumValueSchema({ BUYER: "BUYER", SELLER: "SELLER" } as const);

export function parseManagerAssetFilters(raw: RawSearchParams): ManagerAssetFilters {
  return {
    q: parseOne(raw, "q", querySchema),
    category: parseOne(raw, "category", enumValueSchema(Category)),
    country: parseOne(raw, "country", countrySchema),
    status: parseOne(raw, "status", enumValueSchema(AssetStatus)),
    seller: parseOne(raw, "seller", recordIdSchema),
    page: parseOne(raw, "page", pageSchema) ?? DEFAULT_MANAGER_ASSET_FILTERS.page,
  };
}

export function parseParticipantFilters(raw: RawSearchParams): ParticipantFilters {
  return {
    role: parseOne(raw, "role", roleSchema) ?? DEFAULT_PARTICIPANT_FILTERS.role,
    q: parseOne(raw, "q", querySchema),
    status: parseOne(raw, "status", enumValueSchema(UserStatus)),
    page: parseOne(raw, "page", pageSchema) ?? DEFAULT_PARTICIPANT_FILTERS.page,
  };
}
