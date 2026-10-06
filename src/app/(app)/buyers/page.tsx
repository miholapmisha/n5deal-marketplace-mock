import { PackagePlus, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyerCard } from "@/components/buyers/buyer-card";
import { DirectoryFilterDrawer } from "@/components/buyers/directory-filter-drawer";
import { DirectoryFilterPanel } from "@/components/buyers/directory-filter-panel";
import { DirectoryLink, DirectoryPageLink } from "@/components/buyers/directory-link";
import { DirectoryNavigationProvider } from "@/components/buyers/directory-navigation";
import { DirectorySearch } from "@/components/buyers/directory-search";
import { RankSelect } from "@/components/buyers/rank-select";
import { Pagination } from "@/components/filters/pagination";
import { Button } from "@/components/ui/button";
import { BUYERS_PAGE_SIZE, type BuyerFilters, hasActiveBuyerFilters } from "@/lib/buyer-filters";
import { parseBuyerFilters } from "@/lib/parse-buyer-filters";
import { requireRole } from "@/server/auth/guards";
import {
  type BuyerDirectoryPage,
  getDirectoryCountryOptions,
  listBuyerDirectory,
} from "@/server/buyers/buyer.service";

export const metadata: Metadata = {
  title: "Buyers",
};

// S8. Private: active sellers and managers only. Filters live in the URL like the catalog's;
// a seller can rank every matching buyer against one of their published assets.
export default async function BuyersPage({ searchParams }: PageProps<"/buyers">) {
  const viewer = await requireRole("SELLER", "MANAGER");
  const requested = parseBuyerFilters(await searchParams);
  const [directory, countries] = await Promise.all([
    listBuyerDirectory(requested),
    getDirectoryCountryOptions(requested.countries),
  ]);
  if (!directory) notFound();
  // What was applied: the clamped page, and no ranking when `rank` was not the viewer's asset.
  const filters: BuyerFilters = { ...requested, page: directory.page, rank: directory.rankedFor?.id ?? null };

  const first = (directory.page - 1) * BUYERS_PAGE_SIZE + 1;
  const last = first + directory.buyers.length - 1;

  return (
    <DirectoryNavigationProvider filters={filters} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Buyers</h1>
          <p className="text-muted-foreground">
            Acquirers looking for licensed fintech businesses. Only sellers and platform managers see this list.
          </p>
        </div>
        <DirectorySearch />
      </header>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-lg font-semibold">Filters</h2>
            <DirectoryFilterPanel countries={countries} />
          </div>
        </aside>

        <section aria-labelledby="results-summary" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-summary" aria-live="polite" className="text-sm text-muted-foreground">
              {directory.total === 0
                ? "No buyers found"
                : `Showing ${first}–${last} of ${directory.total} ${directory.total === 1 ? "buyer" : "buyers"}`}
            </h2>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DirectoryFilterDrawer countries={countries} total={directory.total} />
              {viewer.role === "SELLER" && <RankControl directory={directory} />}
            </div>
          </div>

          {directory.rankedFor && (
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
              Ranked by fit with <span className="font-semibold">{directory.rankedFor.title}</span>: target
              category, country, ticket size, and business status preference.
            </p>
          )}

          {directory.buyers.length === 0 ? (
            <EmptyState filters={filters} />
          ) : (
            <ul className="grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 group-has-data-pending/buyers:opacity-50">
              {directory.buyers.map((buyer) => (
                <li key={buyer.id} className="flex">
                  <BuyerCard
                    buyer={buyer}
                    canContact={viewer.role === "SELLER"}
                    rankAssetId={directory.rankedFor?.id ?? null}
                  />
                </li>
              ))}
            </ul>
          )}

          <Pagination page={directory.page} pageCount={directory.pageCount} PageLink={DirectoryPageLink} />
        </section>
      </div>
    </DirectoryNavigationProvider>
  );
}

/** Sellers rank buyers against a published asset; with none yet, say how to get one. */
function RankControl({ directory }: { directory: BuyerDirectoryPage }) {
  if (directory.rankOptions && directory.rankOptions.length > 0) {
    return <RankSelect options={directory.rankOptions} />;
  }
  return (
    <Link
      href="/seller/assets/new"
      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <PackagePlus className="size-4" aria-hidden />
      Publish an asset to rank buyers by fit
    </Link>
  );
}

function EmptyState({ filters }: { filters: BuyerFilters }) {
  const filtered = hasActiveBuyerFilters(filters);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{filtered ? "No buyers match these filters" : "No buyers are listed yet."}</p>
      {filtered && (
        <>
          <p className="text-sm text-muted-foreground">Try removing a filter or searching for something broader.</p>
          <Button asChild className="h-10 rounded-full px-5">
            <DirectoryLink reset>Reset filters</DirectoryLink>
          </Button>
        </>
      )}
    </div>
  );
}
