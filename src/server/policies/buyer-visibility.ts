import "server-only";

import type { Prisma, Role, UserStatus } from "@/generated/prisma/client";

// SPEC §4.1 — the buyer directory (S8) and buyer detail (S9) are private: acquisition plans
// are commercially sensitive. Visibility is derived at query time, like assets.

/** Active sellers and managers. Inactive users never have a session, so role is enough. */
export function canBrowseBuyers(viewer: { role: Role } | null): boolean {
  return viewer?.role === "SELLER" || viewer?.role === "MANAGER";
}

interface BuyerFacts {
  role: Role;
  status: UserStatus;
  buyerProfile: { isVisible: boolean } | null;
}

/** An active buyer who has a profile and shows it to sellers. */
export function isBuyerListed(buyer: BuyerFacts): boolean {
  return buyer.role === "BUYER" && buyer.status === "ACTIVE" && buyer.buyerProfile?.isVisible === true;
}

export const listedBuyerWhere = {
  role: "BUYER",
  status: "ACTIVE",
  buyerProfile: { is: { isVisible: true } },
} as const satisfies Prisma.UserWhereInput;
