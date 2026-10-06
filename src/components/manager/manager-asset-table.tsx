import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { AssetModerationButton } from "@/components/manager/moderation-buttons";
import { AssetStatusBadge } from "@/components/seller/asset-status-badge";
import { countryFlag, countryName, formatDate, formatPrice } from "@/lib/format";
import { CATEGORY_LABELS, USER_STATUS_LABELS } from "@/lib/labels";
import type { ManagerAssetRow } from "@/server/moderation/moderation.service";

const headClass = "px-4 py-3 font-medium whitespace-nowrap";
const cellClass = "px-4 py-3 align-top";

export function ManagerAssetTable({ assets }: { assets: ManagerAssetRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full min-w-[60rem] text-left text-sm">
        <thead className="border-b border-row-border bg-muted text-xs text-muted-foreground">
          <tr>
            <th scope="col" className={headClass}>
              Asset
            </th>
            <th scope="col" className={headClass}>
              Seller
            </th>
            <th scope="col" className={headClass}>
              Category
            </th>
            <th scope="col" className={headClass}>
              Price
            </th>
            <th scope="col" className={headClass}>
              Status
            </th>
            <th scope="col" className={headClass}>
              Published
            </th>
            <th scope="col" className={`${headClass} text-right`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-border">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssetRow({ asset }: { asset: ManagerAssetRow }) {
  const sellerInactive = asset.seller.status !== "ACTIVE";

  return (
    <tr>
      <td className={`${cellClass} max-w-72`}>
        <div className="flex flex-col gap-0.5">
          <Link href={`/assets/${asset.slug}`} className="line-clamp-2 font-semibold hover:text-primary">
            {asset.title}
          </Link>
          <span className="text-xs text-muted-foreground">
            <span aria-hidden>{countryFlag(asset.country)} </span>
            {countryName(asset.country)}
          </span>
        </div>
      </td>
      <td className={`${cellClass} max-w-48`}>
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-2">{asset.seller.displayName}</span>
          {sellerInactive && (
            <span className="text-xs font-medium text-warning">{USER_STATUS_LABELS[asset.seller.status]}</span>
          )}
        </div>
      </td>
      <td className={`${cellClass} whitespace-nowrap`}>{CATEGORY_LABELS[asset.category]}</td>
      <td className={`${cellClass} font-semibold whitespace-nowrap text-primary`}>{formatPrice(asset.priceEur)}</td>
      <td className={`${cellClass} max-w-60`}>
        <div className="flex flex-col items-start gap-1">
          <AssetStatusBadge status={asset.status} />
          {asset.status === "PUBLISHED" && sellerInactive && (
            <span className="text-xs text-muted-foreground">Not public while the seller is {asset.seller.status.toLowerCase()}</span>
          )}
          {asset.statusReason && asset.status !== "PUBLISHED" && (
            <span title={asset.statusReason} className="line-clamp-2 text-xs text-muted-foreground">
              {asset.statusReason}
            </span>
          )}
        </div>
      </td>
      <td className={`${cellClass} whitespace-nowrap text-muted-foreground`}>
        {asset.publishedAt ? formatDate(asset.publishedAt) : "—"}
      </td>
      <td className={cellClass}>
        <div className="flex justify-end gap-1.5 whitespace-nowrap">
          <Link
            href={`/assets/${asset.slug}`}
            aria-label={`View ${asset.title}`}
            className="flex h-7 items-center gap-1 rounded-full px-3 text-[0.8rem] font-medium hover:bg-muted"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View
          </Link>
          {asset.actions.map((action) => (
            <AssetModerationButton key={action} assetId={asset.id} assetTitle={asset.title} action={action} />
          ))}
        </div>
      </td>
    </tr>
  );
}
