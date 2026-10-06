import { SearchX } from "lucide-react";
import type { Metadata } from "next";

import { AssetCard } from "@/components/asset-card";
import { ActiveFilters } from "@/components/catalog/active-filters";
import { CatalogLink } from "@/components/catalog/catalog-link";
import { CatalogNavigationProvider } from "@/components/catalog/catalog-navigation";
import { CatalogPagination } from "@/components/catalog/catalog-pagination";
import { CatalogSearch } from "@/components/catalog/catalog-search";
import { CategoryTabs } from "@/components/catalog/category-tabs";
import { FilterDrawer } from "@/components/catalog/filter-drawer";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { SortSelect } from "@/components/catalog/sort-select";
import { Button } from "@/components/ui/button";
import { CATALOG_PAGE_SIZE, type CatalogFilters, hasActiveFilters } from "@/lib/catalog-filters";
import { parseCatalogFilters } from "@/lib/parse-catalog-filters";
import { getCatalogFacetOptions, listCatalog } from "@/server/assets/asset.service";

export const metadata: Metadata = {
  title: "All listings",
};

export default async function AssetsPage({ searchParams }: PageProps<"/assets">) {
  const requested = parseCatalogFilters(await searchParams);
  const [catalog, options] = await Promise.all([listCatalog(requested), getCatalogFacetOptions(requested)]);
  const filters: CatalogFilters = { ...requested, page: catalog.page, sort: catalog.sort };

  const first = (catalog.page - 1) * CATALOG_PAGE_SIZE + 1;
  const last = first + catalog.assets.length - 1;

  return (
    <CatalogNavigationProvider filters={filters} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All listings</h1>
          <p className="text-muted-foreground">
            Licensed fintech businesses for sale: banks, EMIs, payment institutions, and crypto companies.
          </p>
        </div>
        <CatalogSearch />
      </header>

      <CategoryTabs filters={filters} counts={catalog.categoryCounts} allCount={catalog.allCount} />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-lg font-semibold">Filters</h2>
            <FilterPanel options={options} />
          </div>
        </aside>

        <section aria-labelledby="results-summary" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-summary" aria-live="polite" className="text-sm text-muted-foreground">
              {catalog.total === 0
                ? "No assets found"
                : `Showing ${first}–${last} of ${catalog.total} ${catalog.total === 1 ? "asset" : "assets"}`}
            </h2>
            <div className="flex items-center gap-2">
              <FilterDrawer options={options} total={catalog.total} />
              <SortSelect bestMatch={catalog.bestMatch} />
            </div>
          </div>

          <ActiveFilters filters={filters} />

          {catalog.assets.length === 0 ? (
            <EmptyState filters={filters} />
          ) : (
            <ul className="grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 group-has-data-pending/catalog:opacity-50">
              {catalog.assets.map((asset) => (
                <li key={asset.id} className="flex">
                  <AssetCard asset={asset} match={asset.match} />
                </li>
              ))}
            </ul>
          )}

          <CatalogPagination page={catalog.page} pageCount={catalog.pageCount} />
        </section>
      </div>
    </CatalogNavigationProvider>
  );
}

function EmptyState({ filters }: { filters: CatalogFilters }) {
  const filtered = hasActiveFilters(filters);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{filtered ? "No assets match these filters" : "No assets are published yet."}</p>
      {filtered && (
        <>
          <p className="text-sm text-muted-foreground">Try removing a filter or searching for something broader.</p>
          <Button asChild className="h-10 rounded-full px-5">
            <CatalogLink reset>Reset filters</CatalogLink>
          </Button>
        </>
      )}
    </div>
  );
}
