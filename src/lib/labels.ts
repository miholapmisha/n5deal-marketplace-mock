import type { AssetStatus, BusinessStatus, BuyerType, Category, Role, StatusPref, Timeline } from "@/generated/prisma/enums";

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

export const ROLE_LABELS: Record<Role, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  MANAGER: "Manager",
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  HIDDEN: "Hidden by manager",
  REMOVED: "Removed",
};

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  PE_FUND: "PE fund",
  STRATEGIC: "Strategic acquirer",
  FAMILY_OFFICE: "Family office",
  FINTECH_OPERATOR: "Fintech operator",
  INDIVIDUAL: "Individual investor",
};

export const STATUS_PREF_LABELS: Record<StatusPref, string> = {
  ANY: "Any",
  ACTIVE: "Active business only",
  LICENSE_ONLY: "License only",
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  IMMEDIATE: "Immediate",
  WITHIN_3_MONTHS: "Within 3 months",
  WITHIN_6_MONTHS: "Within 6 months",
  EXPLORING: "Exploring",
};
