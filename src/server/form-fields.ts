import "server-only";

import { z } from "zod";

import { parsePriceInput } from "@/lib/catalog-filters";

// Zod building blocks for forms whose values arrive as the strings a person typed.

/** Record IDs, shared with URL parsing. */
export { recordIdSchema as recordId } from "@/lib/search-params";

/** "" → null; otherwise whole euros ("500000", "500 000", "500,000"), or an error. */
export function optionalEuros(label: string) {
  return z
    .string()
    .trim()
    .max(20, { error: `${label} is too long.` })
    .transform((value, ctx) => {
      if (value === "") return null;
      const euros = parsePriceInput(value);
      if (euros === null) {
        ctx.addIssue({ code: "custom", message: `${label}: enter whole euros, e.g. 500000.` });
        return z.NEVER;
      }
      return euros;
    });
}

interface WholeNumberRange {
  min: number;
  /** A function for limits that move, such as "this year". */
  max: number | (() => number);
}

/** "" → null; otherwise a whole number inside the range, or an error. */
export function optionalWholeNumber(label: string, range: WholeNumberRange) {
  return z
    .string()
    .trim()
    .max(12, { error: `${label} is too long.` })
    .transform((value, ctx) => {
      if (value === "") return null;
      const max = typeof range.max === "function" ? range.max() : range.max;
      const number = /^\d+$/.test(value) ? Number(value) : Number.NaN;
      if (!Number.isInteger(number) || number < range.min || number > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be a whole number from ${range.min} to ${max}.` });
        return z.NEVER;
      }
      return number;
    });
}

interface ChipLimits {
  minLength: number;
  maxLength: number;
  maxItems: number;
}

/** Short tags (benefits, licenses): trimmed, case-insensitive duplicates dropped. */
export function chipList(label: string, { minLength, maxLength, maxItems }: ChipLimits) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(minLength, { error: `Each ${label} needs at least ${minLength} characters.` })
        .max(maxLength, { error: `Each ${label} can have at most ${maxLength} characters.` }),
    )
    .max(maxItems, { error: `Add at most ${maxItems} ${label}s.` })
    .transform((items) =>
      items.filter((item, index) => items.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index),
    );
}
