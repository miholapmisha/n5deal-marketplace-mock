import "server-only";

import type { BuyerProfileInput } from "@/server/buyers/buyer.schema";
import { db } from "@/server/db";

const profileSelect = {
  buyerType: true,
  ticketMinEur: true,
  ticketMaxEur: true,
  categories: true,
  countries: true,
  statusPref: true,
  timeline: true,
  thesis: true,
  isVisible: true,
} as const;

export async function findBuyerProfile(userId: string) {
  return db.buyerProfile.findUnique({ where: { userId }, select: profileSelect });
}

/**
 * Creates or replaces the profile and stores the company on the user, atomically. Returns
 * whether the profile existed before (the first save ends onboarding).
 */
export async function saveBuyerProfile(userId: string, input: BuyerProfileInput): Promise<{ existed: boolean }> {
  const { companyName, ticketMin, ticketMax, ...rest } = input;
  const profile = { ...rest, ticketMinEur: ticketMin, ticketMaxEur: ticketMax };

  return db.$transaction(async (tx) => {
    const existing = await tx.buyerProfile.findUnique({ where: { userId }, select: { userId: true } });
    await tx.buyerProfile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile });
    await tx.user.update({ where: { id: userId }, data: { companyName } });
    return { existed: existing !== null };
  });
}
