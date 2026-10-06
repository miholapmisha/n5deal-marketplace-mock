import "server-only";

import { z } from "zod";

import { BusinessStatus, Category } from "@/generated/prisma/enums";
import { ASSET_INTENTS, ASSET_LIMITS as L } from "@/lib/asset-form";
import { parsePriceInput } from "@/lib/catalog-filters";
import { isCountryCode } from "@/lib/countries";
import { chipList, optionalWholeNumber, recordId } from "@/server/form-fields";

export const assetIdSchema = z.object({ assetId: recordId });

export interface AssetActionState {
  error?: string;
}

export const saveAssetMetaSchema = z.object({
  assetId: recordId.optional(),
  intent: z.enum(ASSET_INTENTS),
});

const PRICE_KEYS: ReadonlySet<PropertyKey | undefined> = new Set(["price", "priceOnRequest"]);

function priceOf(text: string): number | null {
  return parsePriceInput(text) || null;
}

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
    when: (payload) => !payload.issues.some((issue) => PRICE_KEYS.has(issue.path?.[0])),
  })
  .transform(({ price, priceOnRequest, ...values }) => ({
    ...values,
    priceEur: priceOnRequest ? null : priceOf(price),
  }));

export type AssetInput = z.output<typeof assetValuesSchema>;
