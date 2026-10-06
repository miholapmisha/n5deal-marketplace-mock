import { describe, expect, it } from "vitest";

import type { AssetStatus, Role, UserStatus } from "@/generated/prisma/enums";
import {
  type AssetViewer,
  canSeeSellerIdentity,
  canViewAsset,
  isPubliclyVisible,
  publicAssetWhere,
} from "@/server/policies/asset-visibility";
import { canBrowseBuyers, isBuyerListed, listedBuyerWhere } from "@/server/policies/buyer-visibility";

// SPEC §4.1 — the pure rules and the Prisma `where` builders must say the same thing.

const ASSET_STATUSES: AssetStatus[] = ["DRAFT", "PUBLISHED", "HIDDEN", "REMOVED"];
const USER_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "REMOVED"];

const owner: AssetViewer = { id: "seller_1", role: "SELLER" };
const otherSeller: AssetViewer = { id: "seller_2", role: "SELLER" };
const buyer: AssetViewer = { id: "buyer_1", role: "BUYER" };
const manager: AssetViewer = { id: "manager_1", role: "MANAGER" };

const assetOf = (status: AssetStatus, sellerStatus: UserStatus = "ACTIVE") => ({
  status,
  sellerId: owner.id,
  seller: { status: sellerStatus },
});

describe("public asset visibility", () => {
  it("shows only published assets of active sellers", () => {
    for (const status of ASSET_STATUSES) {
      for (const sellerStatus of USER_STATUSES) {
        const visible = status === "PUBLISHED" && sellerStatus === "ACTIVE";
        expect(isPubliclyVisible(assetOf(status, sellerStatus)), `${status} / ${sellerStatus}`).toBe(visible);
      }
    }
  });

  it("matches the Prisma where builder", () => {
    expect(publicAssetWhere).toEqual({ status: "PUBLISHED", seller: { status: "ACTIVE" } });
  });
});

describe("canViewAsset", () => {
  it("lets anonymous visitors, buyers, and other sellers see public assets only", () => {
    for (const viewer of [null, buyer, otherSeller]) {
      expect(canViewAsset(assetOf("PUBLISHED"), viewer)).toBe(true);
      expect(canViewAsset(assetOf("PUBLISHED", "SUSPENDED"), viewer)).toBe(false);
      expect(canViewAsset(assetOf("DRAFT"), viewer)).toBe(false);
      expect(canViewAsset(assetOf("HIDDEN"), viewer)).toBe(false);
    }
  });

  it("lets the owner see every status except removed", () => {
    expect(canViewAsset(assetOf("DRAFT"), owner)).toBe(true);
    expect(canViewAsset(assetOf("HIDDEN"), owner)).toBe(true);
    expect(canViewAsset(assetOf("REMOVED"), owner)).toBe(false);
  });

  it("does not treat a buyer with the owner's id as the owner", () => {
    expect(canViewAsset(assetOf("DRAFT"), { id: owner.id, role: "BUYER" })).toBe(false);
  });

  it("lets managers see everything", () => {
    for (const status of ASSET_STATUSES) {
      expect(canViewAsset(assetOf(status, "SUSPENDED"), manager)).toBe(true);
    }
  });
});

describe("canSeeSellerIdentity", () => {
  const asset = { sellerId: owner.id };

  it("keeps the seller anonymous until the buyer has a conversation", () => {
    expect(canSeeSellerIdentity(asset, null, false)).toBe(false);
    expect(canSeeSellerIdentity(asset, buyer, false)).toBe(false);
    expect(canSeeSellerIdentity(asset, buyer, true)).toBe(true);
    expect(canSeeSellerIdentity(asset, otherSeller, true)).toBe(false);
  });

  it("always names the seller to the owner and to managers", () => {
    expect(canSeeSellerIdentity(asset, owner, false)).toBe(true);
    expect(canSeeSellerIdentity(asset, manager, false)).toBe(true);
  });
});

describe("buyer directory visibility", () => {
  it("is open to sellers and managers only", () => {
    const roles: (Role | null)[] = [null, "BUYER", "SELLER", "MANAGER"];
    expect(roles.map((role) => canBrowseBuyers(role ? { role } : null))).toEqual([false, false, true, true]);
  });

  it("lists active buyers who show their profile", () => {
    const listed = { role: "BUYER" as const, status: "ACTIVE" as const, buyerProfile: { isVisible: true } };
    expect(isBuyerListed(listed)).toBe(true);
    expect(isBuyerListed({ ...listed, buyerProfile: { isVisible: false } })).toBe(false);
    expect(isBuyerListed({ ...listed, buyerProfile: null })).toBe(false);
    expect(isBuyerListed({ ...listed, status: "SUSPENDED" })).toBe(false);
    expect(isBuyerListed({ ...listed, status: "REMOVED" })).toBe(false);
    expect(isBuyerListed({ ...listed, role: "SELLER" })).toBe(false);
  });

  it("matches the Prisma where builder", () => {
    expect(listedBuyerWhere).toEqual({ role: "BUYER", status: "ACTIVE", buyerProfile: { is: { isVisible: true } } });
  });
});
