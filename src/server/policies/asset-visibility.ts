import "server-only";

import type { AssetStatus, Prisma, UserStatus } from "@/generated/prisma/client";

// SPEC §4.1 — every query that returns assets to the public goes through these rules.
// Visibility is derived from the seller's status at query time, never stored on the asset,
// so suspending and reinstating a seller needs no data repair.

interface VisibilityFacts {
  status: AssetStatus;
  seller: { status: UserStatus };
}

export function isPubliclyVisible(asset: VisibilityFacts): boolean {
  return asset.status === "PUBLISHED" && asset.seller.status === "ACTIVE";
}

export const publicAssetWhere = {
  status: "PUBLISHED",
  seller: { status: "ACTIVE" },
} as const satisfies Prisma.AssetWhereInput;
