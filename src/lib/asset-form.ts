import type { AssetCardAsset } from "@/components/asset-card";
import type { BusinessStatus, Category } from "@/generated/prisma/enums";
import { parsePriceInput } from "@/lib/catalog-filters";

// The asset form (SPEC §5 S7) as the browser holds it: raw strings, exactly what was typed.
// Client-safe, so the form, its live preview, and the server schema share one shape and one
// set of limits. The server never trusts these values; it re-parses them with Zod.

export const ASSET_LIMITS = {
  titleMin: 10,
  titleMax: 120,
  regulatorMax: 60,
  licenseTypeMin: 2,
  licenseTypeMax: 40,
  chipMin: 2,
  chipMax: 40,
  otherLicensesMax: 10,
  benefitsMax: 8,
  descriptionMin: 100,
  descriptionMax: 5000,
  yearMin: 1950,
  employeesMax: 1_000_000,
} as const;

export const ASSET_INTENTS = ["draft", "publish"] as const;
export type AssetIntent = (typeof ASSET_INTENTS)[number];

export interface AssetFormValues {
  title: string;
  /** "" until the seller picks one. */
  category: Category | "";
  businessStatus: BusinessStatus | "";
  country: string;
  regulator: string;
  licenseType: string;
  otherLicenses: string[];
  /** Whole euros as typed, e.g. "1 850 000". Ignored when `priceOnRequest` is set. */
  price: string;
  priceOnRequest: boolean;
  benefits: string[];
  description: string;
  yearOfIssue: string;
  employees: string;
}

export const EMPTY_ASSET_FORM: AssetFormValues = {
  title: "",
  category: "",
  businessStatus: "",
  country: "",
  regulator: "",
  licenseType: "",
  otherLicenses: [],
  price: "",
  priceOnRequest: false,
  benefits: [],
  description: "",
  yearOfIssue: "",
  employees: "",
};

export type AssetFormField = keyof AssetFormValues;

/** Returned to `useActionState` by the save action. Values stay in the client's own state. */
export interface AssetFormState {
  error?: string;
  fieldErrors?: Partial<Record<AssetFormField, string[]>>;
}

/**
 * What the catalog card would show for these values, with placeholders for blanks, so the
 * live preview beside the form is the real S3 card (same component).
 */
export function previewAsset(values: AssetFormValues): AssetCardAsset {
  return {
    slug: "",
    title: values.title.trim() || "Your asset title",
    category: values.category || "EMI",
    businessStatus: values.businessStatus || "ACTIVE",
    country: values.country || "EU",
    regulator: values.regulator.trim() || null,
    licenseType: values.licenseType.trim() || "—",
    priceEur: values.priceOnRequest ? null : parsePriceInput(values.price) || null,
    benefits: values.benefits,
    description: values.description.trim() || "A short description of the business appears here.",
  };
}

/** A stored asset as the form edits it. */
export interface StoredAssetFields extends Omit<AssetCardAsset, "slug"> {
  otherLicenses: string[];
  yearOfIssue: number | null;
  employees: number | null;
}

export function assetToFormValues(asset: StoredAssetFields): AssetFormValues {
  return {
    title: asset.title,
    category: asset.category,
    businessStatus: asset.businessStatus,
    country: asset.country,
    regulator: asset.regulator ?? "",
    licenseType: asset.licenseType,
    otherLicenses: asset.otherLicenses,
    price: asset.priceEur?.toString() ?? "",
    priceOnRequest: asset.priceEur === null,
    benefits: asset.benefits,
    description: asset.description,
    yearOfIssue: asset.yearOfIssue?.toString() ?? "",
    employees: asset.employees?.toString() ?? "",
  };
}
