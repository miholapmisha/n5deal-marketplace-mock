import type { BuyerType, Category, StatusPref, Timeline } from "@/generated/prisma/enums";
import { parsePriceInput } from "@/lib/catalog-filters";

export const PROFILE_LIMITS = {
  companyMax: 120,
  thesisMin: 50,
  thesisMax: 2000,
  countriesMax: 60,
} as const;

export interface BuyerProfileFormValues {
  buyerType: BuyerType | "";
  companyName: string;
  ticketMin: string;
  ticketMax: string;
  categories: Category[];
  countries: string[];
  statusPref: StatusPref;
  timeline: Timeline;
  thesis: string;
  isVisible: boolean;
}

export const EMPTY_PROFILE_FORM: BuyerProfileFormValues = {
  buyerType: "",
  companyName: "",
  ticketMin: "",
  ticketMax: "",
  categories: [],
  countries: [],
  statusPref: "ANY",
  timeline: "EXPLORING",
  thesis: "",
  isVisible: true,
};

export type ProfileFormField = keyof BuyerProfileFormValues;

export interface ProfileFormState {
  error?: string;
  fieldErrors?: Partial<Record<ProfileFormField, string[]>>;
  savedAt?: number;
}

const COMPLETENESS_CHECKS: ((values: BuyerProfileFormValues) => boolean)[] = [
  (values) => values.buyerType !== "",
  (values) => values.companyName.trim() !== "",
  (values) => parsePriceInput(values.ticketMin) !== null,
  (values) => parsePriceInput(values.ticketMax) !== null,
  (values) => values.categories.length > 0,
  (values) => values.countries.length > 0,
  (values) => values.thesis.trim().length >= PROFILE_LIMITS.thesisMin,
];

export function profileCompleteness(values: BuyerProfileFormValues): number {
  const filled = COMPLETENESS_CHECKS.filter((check) => check(values)).length;
  return Math.round((filled / COMPLETENESS_CHECKS.length) * 100);
}

export interface StoredProfileFields {
  buyerType: BuyerType;
  ticketMinEur: number | null;
  ticketMaxEur: number | null;
  categories: Category[];
  countries: string[];
  statusPref: StatusPref;
  timeline: Timeline;
  thesis: string;
  isVisible: boolean;
}

export function profileToFormValues(companyName: string | null, profile: StoredProfileFields | null): BuyerProfileFormValues {
  const company = companyName ?? "";
  if (!profile) return { ...EMPTY_PROFILE_FORM, companyName: company };
  return {
    buyerType: profile.buyerType,
    companyName: company,
    ticketMin: profile.ticketMinEur?.toString() ?? "",
    ticketMax: profile.ticketMaxEur?.toString() ?? "",
    categories: profile.categories,
    countries: profile.countries,
    statusPref: profile.statusPref,
    timeline: profile.timeline,
    thesis: profile.thesis,
    isVisible: profile.isVisible,
  };
}
