import { expect, test } from "@playwright/test";

import { loginAs, SEED } from "./support";

test("buyer contacts a seller from the best-match catalog", async ({ page }) => {
  await loginAs(page, "buyer");

  await page.getByRole("combobox", { name: "Sort" }).selectOption("best-match");
  await expect(page).toHaveURL(/sort=best-match/);
  await expect(page.getByRole("article").first()).toContainText("100% match");

  const scores = (await page.getByText(/^\d+% match$/).allTextContents()).map((text) => Number.parseInt(text, 10));
  expect(scores.length).toBeGreaterThan(1);
  expect(scores).toEqual(scores.toSorted((a, b) => b - a));

  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: SEED.buyerTarget.title }) });
  await card.getByRole("link", { name: "View asset" }).click();
  await expect(page.getByRole("heading", { level: 1, name: SEED.buyerTarget.title })).toBeVisible();

  await page.getByRole("link", { name: "Contact seller" }).click();
  await expect(page).toHaveURL(new RegExp(`/messages/new\\?asset=${SEED.buyerTarget.slug}$`));

  const message = `Is the iGaming merchant book part of the sale? (e2e ${Date.now()})`;
  await page.getByLabel("Your first message").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  const thread = page.getByRole("list", { name: "Messages" });

  await expect(page).toHaveURL(/\/messages\/(?!new)[\w-]+$/);
  await expect(thread.getByText(message)).toBeVisible();

  await page.reload();
  await expect(thread.getByText(message)).toBeVisible();
});
