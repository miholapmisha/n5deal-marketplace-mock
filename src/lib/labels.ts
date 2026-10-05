import type { BusinessStatus, Category } from "@/generated/prisma/enums";

export const CATEGORY_LABELS: Record<Category, string> = {
  BANK: "Bank",
  FINTECH: "Fintech",
  PAYMENT: "Payment",
  EMI: "EMI",
  CRYPTO: "Crypto",
};

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  ACTIVE: "Active",
  LICENSE_ONLY: "License only",
};

/** The "Type of Asset" line on n5deal.com cards. */
export const ASSET_TYPE_LABELS: Record<BusinessStatus, string> = {
  ACTIVE: "Active Business (Licensed)",
  LICENSE_ONLY: "License only",
};
