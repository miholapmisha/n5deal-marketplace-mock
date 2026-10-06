import { expect, type Page } from "@playwright/test";

import type { DemoRole } from "@/lib/demo-accounts";

const DEMO_CARDS: Record<DemoRole, RegExp> = {
  buyer: /Enter as Buyer/,
  seller: /Enter as Seller/,
  manager: /Enter as Manager/,
};

/** Where each role lands after logging in (src/lib/auth-paths.ts). */
const HOMES: Record<DemoRole, RegExp> = {
  buyer: /\/assets$/,
  seller: /\/seller\/assets$/,
  manager: /\/manager$/,
};

/** One-click demo login (SPEC §5 S1). */
export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: DEMO_CARDS[role] }).click();
  await expect(page).toHaveURL(HOMES[role]);
}

/** Seed data the flows rely on (prisma/seed-data). */
export const SEED = {
  /** Demo seller's company; owns `lithuania-emi-101`, which the demo buyer already discusses. */
  sellerCompany: "Baltic Fintech Holdings",
  sellerAsset: { slug: "lithuania-emi-101", title: "Lithuanian EMI with direct SEPA access" },
  sellerThread: "/messages/conv_demo_lt_emi",
  /** A 100% match for the demo buyer that they have not contacted yet. */
  buyerTarget: { slug: "cyprus-emi-107", title: "Cypriot EMI serving iGaming merchants" },
} as const;
