import "server-only";

import type { AssetStatus, Prisma, Role, UserStatus } from "@/generated/prisma/client";

// SPEC §4.1 — every query that returns assets to the public goes through these rules.
// Visibility is derived from the seller's status at query time, never stored on the asset,
// so suspending and reinstating a seller needs no data repair.

interface VisibilityFacts {
  status: AssetStatus;
  seller: { status: UserStatus };
}

interface OwnedVisibilityFacts extends VisibilityFacts {
  sellerId: string;
}

/** Who is looking. `null` is an anonymous visitor. */
export interface AssetViewer {
  id: string;
  role: Role;
}

export function isPubliclyVisible(asset: VisibilityFacts): boolean {
  return asset.status === "PUBLISHED" && asset.seller.status === "ACTIVE";
}

export const publicAssetWhere = {
  status: "PUBLISHED",
  seller: { status: "ACTIVE" },
} as const satisfies Prisma.AssetWhereInput;

export function isAssetOwner(asset: { sellerId: string }, viewer: AssetViewer | null): boolean {
  return viewer?.role === "SELLER" && viewer.id === asset.sellerId;
}

/**
 * Asset detail (S4): the public sees published assets of active sellers; the owner also sees
 * drafts and hidden assets (never removed ones); managers see everything.
 */
export function canViewAsset(asset: OwnedVisibilityFacts, viewer: AssetViewer | null): boolean {
  if (viewer?.role === "MANAGER") return true;
  if (isAssetOwner(asset, viewer)) return asset.status !== "REMOVED";
  return isPubliclyVisible(asset);
}

/**
 * Sellers are anonymous ("Verified seller", SPEC §1.4) until the viewing buyer has a
 * conversation about this asset. Owners and managers always know who the seller is.
 */
export function canSeeSellerIdentity(
  asset: { sellerId: string },
  viewer: AssetViewer | null,
  hasConversation: boolean,
): boolean {
  if (viewer?.role === "MANAGER" || isAssetOwner(asset, viewer)) return true;
  return viewer?.role === "BUYER" && hasConversation;
}
