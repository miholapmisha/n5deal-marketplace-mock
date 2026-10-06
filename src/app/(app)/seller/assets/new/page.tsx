import type { Metadata } from "next";

import { AssetFormPage } from "@/components/seller/asset-form-page";
import { EMPTY_ASSET_FORM } from "@/lib/asset-form";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Publish an asset",
};

export default async function NewAssetPage() {
  await requireRole("SELLER");
  return (
    <AssetFormPage
      title="Publish an asset"
      description="Describe the license or business. Buyers see the card on the right in the catalog; your identity stays hidden until you talk to them."
      status={null}
      initialValues={EMPTY_ASSET_FORM}
    />
  );
}
