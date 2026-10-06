import Link from "next/link";
import { cn } from "cn";

import { MatchBadge } from "@/components/match-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BusinessStatus, Category } from "@/generated/prisma/enums";
import { countryFlag, countryName, formatPrice } from "@/lib/format";
import { ASSET_TYPE_LABELS, BUSINESS_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/labels";

const MAX_BENEFITS = 3;

/** Only what the card renders, so the asset form's live preview (S7) can reuse it. */
export interface AssetCardAsset {
  slug: string;
  title: string;
  category: Category;
  businessStatus: BusinessStatus;
  country: string;
  regulator: string | null;
  licenseType: string;
  priceEur: number | null;
  benefits: string[];
  description: string;
}

interface AssetCardProps {
  asset: AssetCardAsset;
  /** Hides the "View asset" link, e.g. in a preview of an unsaved asset. */
  preview?: boolean;
  /** Country name computed on the server, for client renders (see COUNTRY_OPTIONS). */
  countryLabel?: string;
  /** The viewing buyer's match score; shown as a badge when set. */
  match?: number | null;
}

export function AssetCard({ asset, preview = false, countryLabel, match = null }: AssetCardProps) {
  const isActive = asset.businessStatus === "ACTIVE";
  const country = countryLabel ?? countryName(asset.country);
  const rows: { label: string; value: string; className?: string }[] = [
    { label: "Country", value: country },
    { label: "Type of business", value: CATEGORY_LABELS[asset.category] },
    {
      label: "Business status",
      value: BUSINESS_STATUS_LABELS[asset.businessStatus],
      className: isActive ? "text-success" : undefined,
    },
    { label: "License", value: asset.licenseType },
    { label: "Regulator", value: asset.regulator ?? "N/A" },
  ];

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="text-2xl leading-none">
            {countryFlag(asset.country)}
          </span>
          <span className="truncate">{country}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {match !== null && <MatchBadge score={match} />}
          <Badge variant="secondary">{CATEGORY_LABELS[asset.category]}</Badge>
        </div>
      </header>

      <h3 className="line-clamp-2 min-h-[2lh] font-semibold leading-snug">{asset.title}</h3>

      <p className="rounded-lg bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
        Type of Asset{" "}
        <span className={cn("font-semibold", isActive ? "text-primary" : "text-foreground")}>
          {ASSET_TYPE_LABELS[asset.businessStatus]}
        </span>
      </p>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between rounded-lg border border-row-border bg-row px-3 py-2">
          <dt className="text-primary">Price</dt>
          <dd className="text-lg font-semibold text-primary">{formatPrice(asset.priceEur)}</dd>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-row-border/60 px-3 py-1.5">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={cn("truncate text-right font-semibold", row.className)}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {asset.benefits.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {asset.benefits.slice(0, MAX_BENEFITS).map((benefit) => (
            <li key={benefit}>
              <Badge variant="outline" className="border-row-border font-normal">
                {benefit}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="line-clamp-2 text-sm text-muted-foreground">{asset.description}</p>

      {!preview && (
        <Button asChild className="mt-auto rounded-full">
          <Link href={`/assets/${asset.slug}`}>View asset</Link>
        </Button>
      )}
    </article>
  );
}
