import type { BuyerType, Category, StatusPref, Timeline } from "@/generated/prisma/enums";
import { parsePriceInput } from "@/lib/catalog-filters";

// The buyer profile form (SPEC §5 S5) as the browser holds it. Client-safe: the form, the
// completeness meter, and the server schema share this shape and these limits.

export const PROFILE_LIMITS = {
  companyMax: 120,
  thesisMin: 50,
  thesisMax: 2000,
  countriesMax: 60,
} as const;

export interface BuyerProfileFormValues {
  /** "" until the buyer picks one. */
  buyerType: BuyerType | "";
  companyName: string;
  /** Whole euros as typed; "" = no bound. */
  ticketMin: string;
  ticketMax: string;
  categories: Category[];
  /** ISO alpha-2; empty = any country. */
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

/** Returned to `useActionState` by the save action. Values stay in the client's own state. */
export interface ProfileFormState {
  error?: string;
  fieldErrors?: Partial<Record<ProfileFormField, string[]>>;
  /** Set after a successful save that stays on the page. */
  savedAt?: number;
}

/**
 * Fields that say something about the buyer when filled. Status preference and timeline
 * always hold a value (they have defaults), so they cannot measure effort and are left out.
 */
const COMPLETENESS_CHECKS: ((values: BuyerProfileFormValues) => boolean)[] = [
  (values) => values.buyerType !== "",
  (values) => values.companyName.trim() !== "",
  (values) => parsePriceInput(values.ticketMin) !== null,
  (values) => parsePriceInput(values.ticketMax) !== null,
  (values) => values.categories.length > 0,
  (values) => values.countries.length > 0,
  (values) => values.thesis.trim().length >= PROFILE_LIMITS.thesisMin,
];

/** Share of filled fields, 0–100 (SPEC §5 S5 "profile completeness meter"). */
export function profileCompleteness(values: BuyerProfileFormValues): number {
  const filled = COMPLETENESS_CHECKS.filter((check) => check(values)).length;
  return Math.round((filled / COMPLETENESS_CHECKS.length) * 100);
}

/** A stored profile as the form edits it. */
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
