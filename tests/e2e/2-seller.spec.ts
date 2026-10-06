import { expect, test } from "@playwright/test";

import { loginAs } from "./support";

const MARKER = "Zephyrine";
const TITLE = `${MARKER} Maltese EMI with card issuing`;
const DESCRIPTION =
  "Electronic money institution authorised by the MFSA with a principal-member card programme, " +
  "safeguarding at two EU banks, and EEA passporting in twelve countries.";

test("seller publishes an asset, ranks buyers for it, and contacts the best fit", async ({ page }) => {
  await loginAs(page, "seller");

  await page.goto("/seller/assets/new");
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Category").selectOption("EMI");
  await page.getByLabel("Business status").selectOption("ACTIVE");
  await page.getByLabel("Country").selectOption("MT");
  await page.getByLabel("Regulator (optional)").fill("MFSA");
  await page.getByLabel("License type").fill("EMI");
  await page.getByLabel("Price (€)").fill("2 400 000");
  await page.getByLabel("Description").fill(DESCRIPTION);
  await page.getByRole("button", { name: "Publish" }).click();

  await expect(page).toHaveURL(/\/seller\/assets$/);
  await expect(page.getByText(TITLE)).toBeVisible();

  await page.goto("/assets");
  await page.getByRole("searchbox", { name: "Search assets" }).fill(MARKER);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`q=${MARKER}`));
  await expect(page.getByRole("heading", { level: 3, name: TITLE })).toBeVisible();

  await page.goto("/buyers");
  await page.getByRole("combobox", { name: "Rank for" }).selectOption({ label: TITLE });
  await expect(page).toHaveURL(/rank=/);
  const bestFit = page.getByRole("article").first();
  await expect(bestFit).toContainText(/\d+% match/);
  const buyerName = (await bestFit.getByRole("heading", { level: 3 }).textContent())?.trim() ?? "";
  expect(buyerName).not.toBe("");

  await bestFit.getByRole("link", { name: "Contact" }).click();
  await expect(page.getByRole("heading", { level: 1, name: buyerName })).toBeVisible();
  await expect(page.getByLabel("About which asset?").locator("option:checked")).toHaveText(
    new RegExp(`^${TITLE} · \\d+% match$`),
  );

  const message = `Our Maltese EMI fits your thesis; shall we talk? (e2e ${Date.now()})`;
  await page.getByLabel("Your first message").fill(message);
  await page.getByRole("button", { name: "Send" }).click();
  const thread = page.getByRole("list", { name: "Messages" });

  await expect(page).toHaveURL(/\/messages\/[\w-]+$/);
  await expect(thread.getByText(message)).toBeVisible();
  await page.reload();
  await expect(thread.getByText(message)).toBeVisible();
});
