import { type Browser, type BrowserContext, expect, type Page, test } from "@playwright/test";

import { loginAs, SEED } from "./support";

const LITHUANIA_CATALOG = "/assets?country=LT";

const contexts: BrowserContext[] = [];

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  contexts.push(context);
  return context.newPage();
}

test.afterEach(async () => {
  await Promise.all(contexts.splice(0).map((context) => context.close()));
});

async function moderateSeller(manager: Page, action: "Suspend" | "Reinstate", reason: string): Promise<void> {
  await manager.getByRole("button", { name: `${action} ${SEED.sellerCompany}` }).click();
  const dialog = manager.getByRole("dialog");
  await dialog.getByLabel("Reason").fill(reason);
  await dialog.getByRole("button", { name: action }).click();
  await expect(dialog).toBeHidden();
}

test("manager suspends a seller: listings vanish, session ends, buyer sees the banner", async ({ browser }) => {
  const [manager, seller, buyer, visitor] = await Promise.all([1, 2, 3, 4].map(() => newPage(browser)));
  const sellerListing = visitor.getByRole("heading", { level: 3, name: SEED.sellerAsset.title });

  await loginAs(seller, "seller");
  await visitor.goto(LITHUANIA_CATALOG);
  await expect(sellerListing).toBeVisible();

  await loginAs(manager, "manager");
  await manager.goto("/manager/users?role=seller");
  await moderateSeller(manager, "Suspend", "Ownership documents for this listing could not be verified.");
  const sellerRow = manager.getByRole("row").filter({ hasText: SEED.sellerCompany });
  await expect(sellerRow).toContainText("Suspended");

  await visitor.reload();
  await expect(sellerListing).toHaveCount(0);
  await visitor.goto(`/assets/${SEED.sellerAsset.slug}`);
  await expect(visitor.getByRole("heading", { level: 1, name: SEED.sellerAsset.title })).toHaveCount(0);

  await seller.goto("/seller/assets");
  await expect(seller).toHaveURL(/\/login/);

  await loginAs(buyer, "buyer");
  await buyer.goto(SEED.sellerThread);
  await expect(buyer.getByRole("status").filter({ hasText: "seller's account is suspended" })).toBeVisible();
  await expect(buyer.getByRole("textbox")).toBeDisabled();

  await moderateSeller(manager, "Reinstate", "Documents verified after review.");
  await expect(sellerRow).toContainText("Active");
  await visitor.goto(LITHUANIA_CATALOG);
  await expect(sellerListing).toBeVisible();
});
