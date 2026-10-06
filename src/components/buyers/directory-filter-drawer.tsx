"use client";

import { DirectoryFilterPanel } from "@/components/buyers/directory-filter-panel";
import { useDirectoryNavigation } from "@/components/buyers/directory-navigation";
import { FilterSheet } from "@/components/filters/filter-sheet";
import { buyerPanelFilterCount } from "@/lib/buyer-filters";
import type { CountryOption } from "@/lib/countries";

interface DirectoryFilterDrawerProps {
  countries: CountryOption[];
  /** Results for the current URL; refreshes as each change lands. */
  total: number;
}

/** Mobile: the buyer filter panel in a drawer. */
export function DirectoryFilterDrawer({ countries, total }: DirectoryFilterDrawerProps) {
  const { filters, isPending } = useDirectoryNavigation();

  return (
    <FilterSheet activeCount={buyerPanelFilterCount(filters)} isPending={isPending} total={total}>
      <DirectoryFilterPanel countries={countries} />
    </FilterSheet>
  );
}
