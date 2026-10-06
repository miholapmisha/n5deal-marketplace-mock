import type { AssetCardAsset } from "@/components/asset-card";
import type { BusinessStatus, Category } from "@/generated/prisma/enums";
import { parsePriceInput } from "@/lib/catalog-filters";

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
  category: Category | "";
  businessStatus: BusinessStatus | "";
  country: string;
  regulator: string;
  licenseType: string;
  otherLicenses: string[];
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

export interface AssetFormState {
  error?: string;
  fieldErrors?: Partial<Record<AssetFormField, string[]>>;
}

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
