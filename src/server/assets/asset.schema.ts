import "server-only";

import { z } from "zod";

import { BusinessStatus, Category } from "@/generated/prisma/enums";
import { ASSET_INTENTS, ASSET_LIMITS as L } from "@/lib/asset-form";
import { parsePriceInput } from "@/lib/catalog-filters";
import { isCountryCode } from "@/lib/countries";
import { chipList, optionalWholeNumber } from "@/server/form-fields";

/** Asset IDs are cuids in production and `ast_<n>` in the seed. */
const assetId = z
  .string()
  .trim()
  .regex(/^[a-z0-9_]{1,64}$/i);

export const assetIdSchema = z.object({ assetId });

/** Returned to `useActionState` by owner actions on an asset. */
export interface AssetActionState {
  error?: string;
}

// ─── Asset form (S7) ─────────────────────────────────────────────────────────────────────

/** Which asset (absent = a new one) and what to do with it. The values are parsed apart. */
export const saveAssetMetaSchema = z.object({
  assetId: assetId.optional(),
  intent: z.enum(ASSET_INTENTS),
});

const PRICE_KEYS: ReadonlySet<PropertyKey | undefined> = new Set(["price", "priceOnRequest"]);

/** The typed price, or null when it is missing, malformed, or zero. */
function priceOf(text: string): number | null {
  return parsePriceInput(text) || null;
}

/** The form's raw strings → typed asset fields. Field errors are keyed like the form. */
export const assetValuesSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(L.titleMin, { error: `Title must be at least ${L.titleMin} characters.` })
      .max(L.titleMax, { error: `Title must be at most ${L.titleMax} characters.` }),
    category: z.enum(Category, { error: "Choose a category." }),
    businessStatus: z.enum(BusinessStatus, { error: "Choose a business status." }),
    country: z.string().refine(isCountryCode, { error: "Choose a country." }),
    regulator: z
      .string()
      .trim()
      .max(L.regulatorMax, { error: `Regulator must be at most ${L.regulatorMax} characters.` })
      .transform((value) => value || null),
    licenseType: z
      .string()
      .trim()
      .min(L.licenseTypeMin, { error: "Enter the license type, e.g. EMI." })
      .max(L.licenseTypeMax, { error: `License type must be at most ${L.licenseTypeMax} characters.` }),
    otherLicenses: chipList("license", {
      minLength: L.chipMin,
      maxLength: L.chipMax,
      maxItems: L.otherLicensesMax,
    }),
    // Checked below, together with `priceOnRequest`: text left in the box is ignored then.
    price: z.string().trim().max(20, { error: "Price is too long." }),
    priceOnRequest: z.boolean(),
    benefits: chipList("benefit", { minLength: L.chipMin, maxLength: L.chipMax, maxItems: L.benefitsMax }),
    description: z
      .string()
      .trim()
      .min(L.descriptionMin, { error: `Description must be at least ${L.descriptionMin} characters.` })
      .max(L.descriptionMax, { error: `Description must be at most ${L.descriptionMax} characters.` }),
    yearOfIssue: optionalWholeNumber("Year of issue", { min: L.yearMin, max: () => new Date().getUTCFullYear() }),
    employees: optionalWholeNumber("Employees", { min: 0, max: L.employeesMax }),
  })
  .refine((values) => values.priceOnRequest || priceOf(values.price) !== null, {
    path: ["price"],
    error: "Enter the price in whole euros, e.g. 500000, or choose “Price on request”.",
    // Runs even when other fields are invalid, so every error shows on the first submit.
    when: (payload) => !payload.issues.some((issue) => PRICE_KEYS.has(issue.path?.[0])),
  })
  .transform(({ price, priceOnRequest, ...values }) => ({
    ...values,
    priceEur: priceOnRequest ? null : priceOf(price),
  }));

export type AssetInput = z.output<typeof assetValuesSchema>;
