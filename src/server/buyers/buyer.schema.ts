import "server-only";

import { z } from "zod";

import { BuyerType, Category, StatusPref, Timeline } from "@/generated/prisma/enums";
import { PROFILE_LIMITS as L } from "@/lib/buyer-profile-form";
import { isCountryCode } from "@/lib/countries";
import { optionalEuros } from "@/server/form-fields";

const TICKET_KEYS: ReadonlySet<PropertyKey | undefined> = new Set(["ticketMin", "ticketMax"]);

const unique = <T>(items: T[]): T[] => [...new Set(items)];

export const buyerProfileSchema = z
  .object({
    buyerType: z.enum(BuyerType, { error: "Choose what kind of buyer you are." }),
    companyName: z
      .string()
      .trim()
      .max(L.companyMax, { error: `Company name must be at most ${L.companyMax} characters.` })
      .transform((value) => value || null),
    ticketMin: optionalEuros("Minimum ticket"),
    ticketMax: optionalEuros("Maximum ticket"),
    categories: z.array(z.enum(Category, { error: "Unknown category." })).transform(unique),
    countries: z
      .array(z.string().refine(isCountryCode, { error: "Unknown country." }))
      .max(L.countriesMax, { error: `Pick at most ${L.countriesMax} countries, or none for any country.` })
      .transform(unique),
    statusPref: z.enum(StatusPref, { error: "Choose a business status preference." }),
    timeline: z.enum(Timeline, { error: "Choose a timeline." }),
    thesis: z
      .string()
      .trim()
      .min(L.thesisMin, { error: `Describe your thesis in at least ${L.thesisMin} characters.` })
      .max(L.thesisMax, { error: `Thesis must be at most ${L.thesisMax} characters.` }),
    isVisible: z.boolean(),
  })
  .refine((values) => values.ticketMin === null || values.ticketMax === null || values.ticketMin <= values.ticketMax, {
    path: ["ticketMax"],
    error: "Maximum ticket must be at least the minimum.",
    when: (payload) => !payload.issues.some((issue) => TICKET_KEYS.has(issue.path?.[0])),
  });

export type BuyerProfileInput = z.output<typeof buyerProfileSchema>;
