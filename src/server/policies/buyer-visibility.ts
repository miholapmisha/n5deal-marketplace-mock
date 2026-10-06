import "server-only";

import type { Prisma, Role, UserStatus } from "@/generated/prisma/client";

export function canBrowseBuyers(viewer: { role: Role } | null): boolean {
  return viewer?.role === "SELLER" || viewer?.role === "MANAGER";
}

interface BuyerFacts {
  role: Role;
  status: UserStatus;
  buyerProfile: { isVisible: boolean } | null;
}

export function isBuyerListed(buyer: BuyerFacts): boolean {
  return buyer.role === "BUYER" && buyer.status === "ACTIVE" && buyer.buyerProfile?.isVisible === true;
}

export const listedBuyerWhere = {
  role: "BUYER",
  status: "ACTIVE",
  buyerProfile: { is: { isVisible: true } },
} as const satisfies Prisma.UserWhereInput;
