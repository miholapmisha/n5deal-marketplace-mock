"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { BuyerProfileFormValues, ProfileFormState } from "@/lib/buyer-profile-form";
import { CATALOG_PATH, catalogHref, DEFAULT_CATALOG_FILTERS } from "@/lib/catalog-filters";
import { buyerProfileSchema } from "@/server/buyers/buyer.schema";
import { saveOwnBuyerProfile } from "@/server/buyers/buyer.service";

export async function saveProfileAction(
  _prev: ProfileFormState,
  values: BuyerProfileFormValues,
): Promise<ProfileFormState> {
  const parsed = buyerProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Some fields need attention.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await saveOwnBuyerProfile(parsed.data);
  if (!result.ok) return { error: result.error };

  revalidatePath("/profile");
  revalidatePath("/buyers");
  revalidatePath(CATALOG_PATH);
  if (result.firstSave) redirect(catalogHref({ ...DEFAULT_CATALOG_FILTERS, sort: "best-match" }));
  return { savedAt: Date.now() };
}
