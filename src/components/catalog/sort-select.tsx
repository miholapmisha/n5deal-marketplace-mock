"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { CATALOG_SORTS, type CatalogSort, SORT_LABELS } from "@/lib/catalog-filters";
import type { BestMatchAvailability } from "@/server/assets/asset.service";

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value);
}

interface SortSelectProps {
  bestMatch: BestMatchAvailability;
}

export function SortSelect({ bestMatch }: SortSelectProps) {
  const { filters, apply } = useCatalogNavigation();
  const sorts = bestMatch === "hidden" ? CATALOG_SORTS.filter((sort) => sort !== "best-match") : CATALOG_SORTS;

  return (
    <div className="flex flex-col items-end gap-1">
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
            {sorts.map((sort) => (
              <option key={sort} value={sort} disabled={sort === "best-match" && bestMatch === "needs-profile"}>
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
      {bestMatch === "needs-profile" && (
        <Link href="/profile" className="text-xs font-medium text-primary hover:underline">
          Complete your profile to sort by best match
        </Link>
      )}
    </div>
  );
}
