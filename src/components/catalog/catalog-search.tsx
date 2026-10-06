"use client";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { SearchBox } from "@/components/filters/search-box";

/** Keyword search over title, description, license, regulator, and country name. */
export function CatalogSearch() {
  const { filters, apply } = useCatalogNavigation();

  return (
    <SearchBox
      query={filters.q}
      onSearch={(q) => apply({ q })}
      placeholder="Search by license, country, regulator…"
      label="Search assets"
    />
  );
}
