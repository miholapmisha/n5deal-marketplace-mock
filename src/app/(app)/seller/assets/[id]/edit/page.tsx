import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssetFormPage } from "@/components/seller/asset-form-page";
import { assetToFormValues } from "@/lib/asset-form";
import { requireRole } from "@/server/auth/guards";
import { getAssetForEdit } from "@/server/assets/asset.service";

export const metadata: Metadata = {
  title: "Edit asset",
};

export default async function EditAssetPage({ params }: PageProps<"/seller/assets/[id]/edit">) {
  await requireRole("SELLER");
  const asset = await getAssetForEdit((await params).id);
  if (!asset) notFound();

  return (
    <AssetFormPage
      title="Edit asset"
      assetId={asset.id}
      slug={asset.slug}
      status={asset.status}
      statusReason={asset.statusReason}
      initialValues={assetToFormValues(asset)}
    />
  );
}
