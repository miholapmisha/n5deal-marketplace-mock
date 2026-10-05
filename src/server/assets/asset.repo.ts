import "server-only";

import { db } from "@/server/db";
import { publicAssetWhere } from "@/server/policies/asset-visibility";

// Fields the catalog card needs. Seller identity is deliberately excluded (SPEC §1.4).
export const assetCardSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  businessStatus: true,
  country: true,
  regulator: true,
  licenseType: true,
  priceEur: true,
  benefits: true,
  description: true,
  publishedAt: true,
} as const;

export async function findPublicAssets(take: number) {
  return db.asset.findMany({
    where: publicAssetWhere,
    select: assetCardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
    take,
  });
}

export async function countPublicAssets(): Promise<number> {
  return db.asset.count({ where: publicAssetWhere });
}
