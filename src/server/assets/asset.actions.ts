"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { CATALOG_PATH } from "@/lib/catalog-filters";
import { type AssetActionState, assetIdSchema } from "@/server/assets/asset.schema";
import { unpublishAsset } from "@/server/assets/asset.service";

// Entry points for asset forms: parse → service (ownership + status rules) → revalidate.

export async function unpublishAssetAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  const parsed = assetIdSchema.safeParse({ assetId: formData.get("assetId") });
  if (!parsed.success) return { error: "Asset not found." };

  const result = await unpublishAsset(parsed.data.assetId);
  if (!result.ok) return { error: result.error };

  revalidatePath(CATALOG_PATH);
  revalidatePath(`${CATALOG_PATH}/${result.slug}`);
  revalidatePath("/seller/assets");
  return {};
}
