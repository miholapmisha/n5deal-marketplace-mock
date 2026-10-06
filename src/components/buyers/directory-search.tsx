"use client";

import { useDirectoryNavigation } from "@/components/buyers/directory-navigation";
import { SearchBox } from "@/components/filters/search-box";

/** Keyword search over the buyer's name, company, and investment thesis. */
export function DirectorySearch() {
  const { filters, apply } = useDirectoryNavigation();

  return (
    <SearchBox
      query={filters.q}
      onSearch={(q) => apply({ q })}
      placeholder="Search by name, company, or thesis…"
      label="Search buyers"
    />
  );
}
