import { expect, type Page } from "@playwright/test";

import type { DemoRole } from "@/lib/demo-accounts";

const DEMO_CARDS: Record<DemoRole, RegExp> = {
  buyer: /Enter as Buyer/,
  seller: /Enter as Seller/,
  manager: /Enter as Manager/,
};

const HOMES: Record<DemoRole, RegExp> = {
  buyer: /\/assets$/,
  seller: /\/seller\/assets$/,
  manager: /\/manager$/,
};

export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: DEMO_CARDS[role] }).click();
  await expect(page).toHaveURL(HOMES[role]);
}

export const SEED = {
  sellerCompany: "Baltic Fintech Holdings",
  sellerAsset: { slug: "lithuania-emi-101", title: "Lithuanian EMI with direct SEPA access" },
  sellerThread: "/messages/conv_demo_lt_emi",
  buyerTarget: { slug: "cyprus-emi-107", title: "Cypriot EMI serving iGaming merchants" },
} as const;
