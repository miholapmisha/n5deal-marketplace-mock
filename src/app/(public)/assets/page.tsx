import type { Metadata } from "next";
import { connection } from "next/server";

import { AssetCard } from "@/components/asset-card";
import { listCatalog } from "@/server/assets/asset.service";

export const metadata: Metadata = {
  title: "All listings",
};

export default async function AssetsPage() {
  // Render per request, not at build time: the catalog changes whenever a seller publishes.
  await connection();
  const { assets, total } = await listCatalog();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All listings</h1>
        <p className="text-sm text-muted-foreground">
          Showing {assets.length} of {total} assets
        </p>
      </div>

      {assets.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          No assets are published yet.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <li key={asset.id} className="flex">
              <AssetCard asset={asset} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
