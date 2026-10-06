import "server-only";

import type { AssetStatus, Prisma, Role, UserStatus } from "@/generated/prisma/client";

interface VisibilityFacts {
  status: AssetStatus;
  seller: { status: UserStatus };
}

interface OwnedVisibilityFacts extends VisibilityFacts {
  sellerId: string;
}

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

export function canViewAsset(asset: OwnedVisibilityFacts, viewer: AssetViewer | null): boolean {
  if (viewer?.role === "MANAGER") return true;
  if (isAssetOwner(asset, viewer)) return asset.status !== "REMOVED";
  return isPubliclyVisible(asset);
}

export function canSeeSellerIdentity(
  asset: { sellerId: string },
  viewer: AssetViewer | null,
  hasConversation: boolean,
): boolean {
  if (viewer?.role === "MANAGER" || isAssetOwner(asset, viewer)) return true;
  return viewer?.role === "BUYER" && hasConversation;
}
