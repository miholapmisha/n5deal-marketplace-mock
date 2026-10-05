import "server-only";

import { countPublicAssets, findPublicAssets } from "@/server/assets/asset.repo";

export type AssetCardData = Awaited<ReturnType<typeof findPublicAssets>>[number];

const CATALOG_PAGE_SIZE = 12;

export interface CatalogPage {
  assets: AssetCardData[];
  total: number;
}

// M1: newest published assets only. Filters, facets, and pagination arrive in M3.
export async function listCatalog(): Promise<CatalogPage> {
  const [assets, total] = await Promise.all([findPublicAssets(CATALOG_PAGE_SIZE), countPublicAssets()]);
  return { assets, total };
}
