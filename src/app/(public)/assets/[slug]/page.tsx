import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";

import { AssetActions } from "@/components/asset-detail/asset-actions";
import { AssetStatusBanner } from "@/components/asset-detail/asset-status-banner";
import { MatchBadge } from "@/components/match-badge";
import { Badge } from "@/components/ui/badge";
import { CATALOG_PATH } from "@/lib/catalog-filters";
import { countryFlag, countryName, formatDate, formatPrice } from "@/lib/format";
import { ASSET_TYPE_LABELS, BUSINESS_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/labels";
import { type AssetDetail, getAssetDetail } from "@/server/assets/asset.service";

const META_DESCRIPTION_LENGTH = 160;

export async function generateMetadata({ params }: PageProps<"/assets/[slug]">): Promise<Metadata> {
  const view = await getAssetDetail((await params).slug);
  if (!view) return { title: "Asset not found" };
  return {
    title: view.asset.title,
    description: view.asset.description.slice(0, META_DESCRIPTION_LENGTH),
    robots: view.isPublic ? undefined : { index: false, follow: false },
  };
}

export default async function AssetDetailPage({ params }: PageProps<"/assets/[slug]">) {
  const view = await getAssetDetail((await params).slug);
  if (!view) notFound();
  const { asset } = view;
  const isActive = asset.businessStatus === "ACTIVE";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={CATALOG_PATH}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All listings
      </Link>

      {(view.isOwner || view.viewerRole === "MANAGER") && <AssetStatusBanner view={view} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <article className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden className="text-2xl leading-none">
                  {countryFlag(asset.country)}
                </span>
                {countryName(asset.country)}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {view.match !== null && <MatchBadge score={view.match} />}
                <Badge variant="secondary">{CATEGORY_LABELS[asset.category]}</Badge>
                <Badge
                  variant="outline"
                  className={cn(isActive ? "border-success/30 bg-success/10 text-success" : "border-row-border")}
                >
                  {BUSINESS_STATUS_LABELS[asset.businessStatus]}
                </Badge>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{asset.title}</h1>
            <p className="w-fit rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              Type of Asset{" "}
              <span className={cn("font-semibold", isActive ? "text-primary" : "text-foreground")}>
                {ASSET_TYPE_LABELS[asset.businessStatus]}
              </span>
            </p>
          </header>

          <KeyFacts asset={asset} />

          {asset.benefits.length > 0 && (
            <Section title="Highlights">
              <ul className="flex flex-wrap gap-2">
                {asset.benefits.map((benefit) => (
                  <li key={benefit}>
                    <Badge variant="outline" className="h-7 border-row-border px-3 text-sm font-normal">
                      {benefit}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="About this asset">
            <p className="leading-relaxed whitespace-pre-line text-body">{asset.description}</p>
          </Section>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="flex flex-col gap-1 rounded-2xl border border-row-border bg-row p-5">
            <span className="text-sm text-primary">Price</span>
            <span className="text-3xl font-bold tracking-tight text-primary">{formatPrice(asset.priceEur)}</span>
            {asset.publishedAt && (
              <span className="text-xs text-muted-foreground">Listed {formatDate(asset.publishedAt)}</span>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs text-muted-foreground">Seller</span>
                <span className="truncate font-semibold">{view.sellerName ?? "Verified seller"}</span>
                {!view.sellerName && (
                  <span className="text-xs text-muted-foreground">
                    The seller&apos;s identity is shared once you start a conversation.
                  </span>
                )}
              </div>
            </div>
            <AssetActions view={view} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function KeyFacts({ asset }: { asset: AssetDetail }) {
  const facts: { label: string; value: string }[] = [
    { label: "Country", value: countryName(asset.country) },
    { label: "Regulator", value: asset.regulator ?? "N/A" },
    { label: "License type", value: asset.licenseType },
    { label: "Other licenses", value: asset.otherLicenses.length > 0 ? asset.otherLicenses.join(", ") : "None" },
    { label: "Year of issue", value: asset.yearOfIssue?.toString() ?? "N/A" },
    { label: "Employees", value: asset.employees?.toString() ?? "N/A" },
  ];

  return (
    <Section title="Key facts">
      <dl className="grid gap-2 sm:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-row-border/60 px-3 py-2 text-sm"
          >
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-right font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
