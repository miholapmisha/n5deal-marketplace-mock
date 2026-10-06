"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AssetFormState, AssetFormValues, AssetIntent } from "@/lib/asset-form";
import { CATALOG_PATH } from "@/lib/catalog-filters";
import {
  type AssetActionState,
  assetIdSchema,
  assetValuesSchema,
  saveAssetMetaSchema,
} from "@/server/assets/asset.schema";
import { type AssetChangeResult, publishAsset, saveAsset, unpublishAsset } from "@/server/assets/asset.service";

const MY_ASSETS_PATH = "/seller/assets";

function revalidateAsset(slug: string): void {
  revalidatePath(CATALOG_PATH);
  revalidatePath(`${CATALOG_PATH}/${slug}`);
  revalidatePath(MY_ASSETS_PATH);
}

export interface SaveAssetPayload {
  assetId?: string;
  intent: AssetIntent;
  values: AssetFormValues;
}

export async function saveAssetAction(_prev: AssetFormState, payload: SaveAssetPayload): Promise<AssetFormState> {
  const meta = saveAssetMetaSchema.safeParse(payload);
  if (!meta.success) return { error: "This form is out of date. Refresh the page and try again." };

  const parsed = assetValuesSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Some fields need attention.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await saveAsset(meta.data.assetId, meta.data.intent, parsed.data);
  if (!result.ok) return { error: result.error };

  revalidateAsset(result.slug);
  redirect(MY_ASSETS_PATH);
}

async function changeStatus(
  formData: FormData,
  change: (assetId: string) => Promise<AssetChangeResult>,
): Promise<AssetActionState> {
  const parsed = assetIdSchema.safeParse({ assetId: formData.get("assetId") });
  if (!parsed.success) return { error: "Asset not found." };

  const result = await change(parsed.data.assetId);
  if (!result.ok) return { error: result.error };

  revalidateAsset(result.slug);
  return {};
}

export async function publishAssetAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  return changeStatus(formData, publishAsset);
}

export async function unpublishAssetAction(_prev: AssetActionState, formData: FormData): Promise<AssetActionState> {
  return changeStatus(formData, unpublishAsset);
}
