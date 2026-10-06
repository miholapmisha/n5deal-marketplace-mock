"use client";

import { RotateCcw } from "lucide-react";

import { SearchBox } from "@/components/filters/search-box";
import { type SelectOption, SelectFilter } from "@/components/filters/select-filter";
import { useFilterNavigation } from "@/components/filters/use-filter-navigation";
import { Button } from "@/components/ui/button";
import { AssetStatus, Category } from "@/generated/prisma/enums";
import { ASSET_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/labels";
import {
  DEFAULT_MANAGER_ASSET_FILTERS,
  hasManagerAssetFilters,
  type ManagerAssetFilters,
  managerAssetsHref,
} from "@/lib/manager-filters";

const CATEGORY_OPTIONS: SelectOption<Category>[] = Object.values(Category).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

const STATUS_OPTIONS: SelectOption<AssetStatus>[] = Object.values(AssetStatus).map((value) => ({
  value,
  label: ASSET_STATUS_LABELS[value],
}));

interface AssetTableFiltersProps {
  filters: ManagerAssetFilters;
  countries: SelectOption<string>[];
  sellers: SelectOption<string>[];
}

/** S10: title search plus one-value filters, all in the URL. Changes apply immediately. */
export function AssetTableFilters({ filters, countries, sellers }: AssetTableFiltersProps) {
  const { filters: current, isPending, apply } = useFilterNavigation(filters, managerAssetsHref);

  return (
    <div className="flex flex-col gap-4">
      {isPending && <span hidden data-pending="" />}
      <SearchBox
        query={current.q}
        onSearch={(q) => apply({ q })}
        placeholder="Search by title…"
        label="Search assets by title"
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-end">
        <SelectFilter
          id="filter-category"
          label="Category"
          value={current.category}
          options={CATEGORY_OPTIONS}
          allLabel="All categories"
          onChange={(category) => apply({ category })}
        />
        <SelectFilter
          id="filter-country"
          label="Country"
          value={current.country}
          options={countries}
          allLabel="All countries"
          onChange={(country) => apply({ country })}
        />
        <SelectFilter
          id="filter-status"
          label="Status"
          value={current.status}
          options={STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(status) => apply({ status })}
        />
        <SelectFilter
          id="filter-seller"
          label="Seller"
          value={current.seller}
          options={sellers}
          allLabel="All sellers"
          onChange={(seller) => apply({ seller })}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={!hasManagerAssetFilters(current)}
          onClick={() => apply(DEFAULT_MANAGER_ASSET_FILTERS)}
          className="col-span-2 h-10 rounded-full md:col-span-1"
        >
          <RotateCcw aria-hidden />
          Reset
        </Button>
      </div>
    </div>
  );
}
