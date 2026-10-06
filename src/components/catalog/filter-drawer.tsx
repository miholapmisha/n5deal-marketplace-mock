"use client";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { panelFilterCount } from "@/lib/catalog-filters";
import type { CatalogFacetOptions } from "@/server/assets/asset.service";

interface FilterDrawerProps {
  options: CatalogFacetOptions;
  total: number;
}

export function FilterDrawer({ options, total }: FilterDrawerProps) {
  const { filters, isPending } = useCatalogNavigation();

  return (
    <FilterSheet activeCount={panelFilterCount(filters)} isPending={isPending} total={total}>
      <FilterPanel options={options} />
    </FilterSheet>
  );
}
