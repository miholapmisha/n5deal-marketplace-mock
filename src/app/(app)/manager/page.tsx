import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FilterLink, HrefPageLink } from "@/components/filters/filter-link";
import { Pagination } from "@/components/filters/pagination";
import { AssetTableFilters } from "@/components/manager/asset-table-filters";
import { ManagerAssetTable } from "@/components/manager/manager-asset-table";
import { ModerationLog } from "@/components/manager/moderation-log";
import { OverviewStats } from "@/components/manager/overview-stats";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MANAGER_ASSET_FILTERS,
  hasManagerAssetFilters,
  MANAGER_PAGE_SIZE,
  type ManagerAssetFilters,
  managerAssetsHref,
} from "@/lib/manager-filters";
import { parseManagerAssetFilters } from "@/lib/parse-manager-filters";
import { requireRole } from "@/server/auth/guards";
import {
  getManagerAssetFilterOptions,
  getOverviewStats,
  listManagerAssets,
  listRecentModeration,
} from "@/server/moderation/moderation.service";

export const metadata: Metadata = {
  title: "Overview",
};

// S10. The manager's home: platform numbers, every asset in every status with moderation
// actions, and the latest moderation log. Table filters live in the URL.
export default async function ManagerOverviewPage({ searchParams }: PageProps<"/manager">) {
  await requireRole("MANAGER");
  const requested = parseManagerAssetFilters(await searchParams);
  const [stats, options, log, requestedAssets] = await Promise.all([
    getOverviewStats(),
    getManagerAssetFilterOptions(requested.country),
    listRecentModeration(),
    listManagerAssets(requested),
  ]);
  if (!stats || !requestedAssets) notFound();

  // An unknown seller in the URL is ignored (like an unknown `rank` on S8), not an empty table.
  const sellerKnown = requested.seller === null || options.sellers.some((seller) => seller.value === requested.seller);
  const assets = sellerKnown ? requestedAssets : await listManagerAssets({ ...requested, seller: null });
  if (!assets) notFound();
  const filters: ManagerAssetFilters = { ...requested, seller: sellerKnown ? requested.seller : null, page: assets.page };

  const first = (assets.page - 1) * MANAGER_PAGE_SIZE + 1;
  const last = first + assets.assets.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Overview</h1>
        <p className="text-muted-foreground">Accounts, listings, and moderation across the marketplace.</p>
      </header>

      <OverviewStats stats={stats} />

      <section aria-labelledby="assets-heading" className="group/manager flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="assets-heading" className="text-xl font-semibold">
            Assets
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {assets.total === 0 ? "No assets found" : `Showing ${first}–${last} of ${assets.total}`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
          <AssetTableFilters filters={filters} countries={options.countries} sellers={options.sellers} />
        </div>

        <div className="flex flex-col gap-4 transition-opacity group-has-data-pending/manager:opacity-50">
          {assets.assets.length === 0 ? (
            <EmptyState filtered={hasManagerAssetFilters(filters)} />
          ) : (
            <ManagerAssetTable assets={assets.assets} />
          )}
          <Pagination
            page={assets.page}
            pageCount={assets.pageCount}
            PageLink={({ page, ...props }) => <HrefPageLink href={managerAssetsHref({ ...filters, page })} {...props} />}
          />
        </div>
      </section>

      <section aria-labelledby="log-heading" className="flex flex-col gap-4">
        <h2 id="log-heading" className="text-xl font-semibold">
          Recent moderation
        </h2>
        <ModerationLog entries={log} />
      </section>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{filtered ? "No assets match these filters" : "No assets have been created yet."}</p>
      {filtered && (
        <Button asChild className="h-10 rounded-full px-5">
          <FilterLink href={managerAssetsHref(DEFAULT_MANAGER_ASSET_FILTERS)}>Reset filters</FilterLink>
        </Button>
      )}
    </div>
  );
}
