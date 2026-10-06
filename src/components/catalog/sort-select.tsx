"use client";

import { ChevronDown } from "lucide-react";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { CATALOG_SORTS, type CatalogSort, SORT_LABELS } from "@/lib/catalog-filters";

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value);
}

export function SortSelect() {
  const { filters, apply } = useCatalogNavigation();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <span className="relative">
        <select
          value={filters.sort}
          onChange={(event) => {
            if (isCatalogSort(event.target.value)) apply({ sort: event.target.value });
          }}
          className="h-10 appearance-none rounded-full border border-input bg-card pr-9 pl-4 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CATALOG_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </span>
    </label>
  );
}
