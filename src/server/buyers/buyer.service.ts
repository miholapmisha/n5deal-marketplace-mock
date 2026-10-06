import "server-only";

import { cache } from "react";

import { findBuyerDetail, findBuyerProfile, saveBuyerProfile } from "@/server/buyers/buyer.repo";
import type { BuyerProfileInput } from "@/server/buyers/buyer.schema";
import { getCurrentUser } from "@/server/auth/session";
import { recordId } from "@/server/form-fields";
import { canBrowseBuyers, isBuyerListed } from "@/server/policies/buyer-visibility";

export type BuyerProfileRow = NonNullable<Awaited<ReturnType<typeof findBuyerProfile>>>;

export interface OwnBuyerProfile {
  companyName: string | null;
  /** null until the buyer saves the onboarding form for the first time. */
  profile: BuyerProfileRow | null;
}

/** S5: the logged-in buyer's own profile. Null for anyone who is not a buyer. */
export async function getOwnBuyerProfile(): Promise<OwnBuyerProfile | null> {
  const user = await getCurrentUser();
  if (user?.role !== "BUYER") return null;
  return { companyName: user.companyName, profile: await findBuyerProfile(user.id) };
}

export type SaveProfileResult = { ok: true; firstSave: boolean } | { ok: false; error: string };

export async function saveOwnBuyerProfile(input: BuyerProfileInput): Promise<SaveProfileResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Log in again." };
  if (user.role !== "BUYER") return { ok: false, error: "Only buyers have an acquisition profile." };

  const { existed } = await saveBuyerProfile(user.id, input);
  return { ok: true, firstSave: !existed };
}

// ─── Buyer detail (S9) ───────────────────────────────────────────────────────────────────

type BuyerDetailRow = NonNullable<Awaited<ReturnType<typeof findBuyerDetail>>>;

export interface BuyerDetail extends Omit<BuyerDetailRow, "role" | "status" | "buyerProfile"> {
  profile: NonNullable<BuyerDetailRow["buyerProfile"]>;
}

/**
 * A listed buyer as an active seller or a manager sees them, or null (→ 404) when the viewer
 * may not browse buyers or the buyer is not listed (SPEC §4.1). Memoized per request: the
 * page and its metadata both ask.
 */
export const getBuyerDetail = cache(async (buyerId: string): Promise<BuyerDetail | null> => {
  if (!recordId.safeParse(buyerId).success) return null;
  const [viewer, row] = await Promise.all([getCurrentUser(), findBuyerDetail(buyerId)]);
  if (!canBrowseBuyers(viewer) || !row || !isBuyerListed(row) || !row.buyerProfile) return null;

  const { id, name, companyName, createdAt, buyerProfile } = row;
  return { id, name, companyName, createdAt, profile: buyerProfile };
});
