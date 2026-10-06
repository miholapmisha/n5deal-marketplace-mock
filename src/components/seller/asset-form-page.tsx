import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

import { AssetForm } from "@/components/seller/asset-form";
import { AssetStatusBadge } from "@/components/seller/asset-status-badge";
import type { AssetStatus } from "@/generated/prisma/enums";
import type { AssetFormValues } from "@/lib/asset-form";
import { COUNTRY_OPTIONS } from "@/lib/countries";

interface AssetFormPageProps {
  title: string;
  description?: string;
  assetId?: string;
  slug?: string;
  status: AssetStatus | null;
  statusReason?: string | null;
  initialValues: AssetFormValues;
}

export function AssetFormPage({ title, description, assetId, slug, status, statusReason, initialValues }: AssetFormPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/seller/assets"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My assets
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {status && <AssetStatusBadge status={status} />}
          {slug && (
            <Link
              href={`/assets/${slug}`}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View page
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
        {status === "HIDDEN" && (
          <div role="status" className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="font-semibold">Hidden by a platform manager</p>
            {statusReason && <p className="text-muted-foreground">{statusReason}</p>}
            <p className="mt-1 text-muted-foreground">
              You can still fix the listing; it returns to the catalog once a manager unhides it.
            </p>
          </div>
        )}
      </header>

      <AssetForm assetId={assetId} status={status} initialValues={initialValues} countries={COUNTRY_OPTIONS} />
    </div>
  );
}
