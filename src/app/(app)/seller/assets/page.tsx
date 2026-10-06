import { MessagesSquare, PackagePlus, Pencil, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AssetStatusBadge } from "@/components/seller/asset-status-badge";
import { AssetStatusToggle } from "@/components/seller/asset-status-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buyersHref, DEFAULT_BUYER_FILTERS } from "@/lib/buyer-filters";
import { formatDate, formatPrice } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import { requireRole } from "@/server/auth/guards";
import { listOwnAssets, type OwnAssetRow } from "@/server/assets/asset.service";

export const metadata: Metadata = {
  title: "My assets",
};

export default async function MyAssetsPage() {
  await requireRole("SELLER");
  const assets = await listOwnAssets();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My assets</h1>
          <p className="text-muted-foreground">
            {assets.length === 1 ? "1 asset" : `${assets.length} assets`} · drafts stay private until you publish them.
          </p>
        </div>
        {assets.length > 0 && (
          <Button asChild size="lg" className="h-10 rounded-full px-5">
            <Link href="/seller/assets/new">
              <Plus aria-hidden />
              Publish asset
            </Link>
          </Button>
        )}
      </header>

      {assets.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssetRow({ asset }: { asset: OwnAssetRow }) {
  const conversations = asset._count.conversations;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AssetStatusBadge status={asset.status} />
          <Badge variant="secondary">{CATEGORY_LABELS[asset.category]}</Badge>
        </div>
        <Link href={`/assets/${asset.slug}`} className="line-clamp-2 font-semibold hover:text-primary">
          {asset.title}
        </Link>
        {asset.status === "HIDDEN" && asset.statusReason && (
          <p className="line-clamp-2 text-sm text-warning">Reason: {asset.statusReason}</p>
        )}
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <dt className="sr-only">Price</dt>
            <dd className="font-semibold text-primary">{formatPrice(asset.priceEur)}</dd>
          </div>
          <div className="flex items-center gap-1">
            <dt>
              <MessagesSquare className="size-4" aria-hidden />
              <span className="sr-only">Conversations</span>
            </dt>
            <dd>{conversations === 1 ? "1 conversation" : `${conversations} conversations`}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Updated</dt>
            <dd>{formatDate(asset.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex shrink-0 flex-wrap items-start gap-2 md:justify-end">
        <Button asChild size="sm" variant="ghost" className="rounded-full">
          <Link href={`/seller/assets/${asset.id}/edit`} aria-label={`Edit ${asset.title}`}>
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
        {asset.status === "PUBLISHED" && (
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link
              href={buyersHref({ ...DEFAULT_BUYER_FILTERS, rank: asset.id })}
              aria-label={`Rank buyers for ${asset.title}`}
            >
              <Users aria-hidden />
              Rank buyers
            </Link>
          </Button>
        )}
        {asset.status === "DRAFT" && <AssetStatusToggle assetId={asset.id} mode="publish" />}
        {asset.status === "PUBLISHED" && <AssetStatusToggle assetId={asset.id} mode="unpublish" />}
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
      <PackagePlus className="size-8 text-primary" aria-hidden />
      <p className="text-lg font-semibold">Publish your first asset</p>
      <p className="max-w-md text-sm text-muted-foreground">
        List a license or an operating business. Buyers see it in the catalog; your identity stays private until
        you start a conversation.
      </p>
      <Button asChild size="lg" className="mt-2 h-10 rounded-full px-5">
        <Link href="/seller/assets/new">
          <Plus aria-hidden />
          Publish asset
        </Link>
      </Button>
    </div>
  );
}
