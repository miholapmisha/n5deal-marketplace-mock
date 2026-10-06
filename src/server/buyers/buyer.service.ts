import "server-only";

import { findBuyerProfile, saveBuyerProfile } from "@/server/buyers/buyer.repo";
import type { BuyerProfileInput } from "@/server/buyers/buyer.schema";
import { getCurrentUser } from "@/server/auth/session";

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
