"use client";

import { useDirectoryNavigation } from "@/components/buyers/directory-navigation";
import { CheckboxGroup, type FilterOption } from "@/components/filters/checkbox-group";
import { EuroRange } from "@/components/filters/euro-range";
import { Button } from "@/components/ui/button";
import { BuyerType, Category } from "@/generated/prisma/enums";
import { clearedBuyerFilters, hasActiveBuyerFilters } from "@/lib/buyer-filters";
import { toggleValue } from "@/lib/catalog-filters";
import type { CountryOption } from "@/lib/countries";
import { countryFlag } from "@/lib/format";
import { BUYER_TYPE_LABELS, CATEGORY_LABELS } from "@/lib/labels";

const CATEGORY_OPTIONS: FilterOption<Category>[] = Object.values(Category).map((category) => ({
  value: category,
  label: CATEGORY_LABELS[category],
}));

const BUYER_TYPE_OPTIONS: FilterOption<BuyerType>[] = Object.values(BuyerType).map((type) => ({
  value: type,
  label: BUYER_TYPE_LABELS[type],
}));

interface DirectoryFilterPanelProps {
  countries: CountryOption[];
}

/** S8 filters: side panel on desktop, drawer content on mobile. Changes apply immediately. */
export function DirectoryFilterPanel({ countries }: DirectoryFilterPanelProps) {
  const { filters, apply } = useDirectoryNavigation();

  return (
    <div className="flex flex-col gap-5">
      <CheckboxGroup
        legend="Category interest"
        options={CATEGORY_OPTIONS}
        selected={filters.categories}
        onToggle={(category) => apply({ categories: toggleValue(filters.categories, category) })}
      />
      <CheckboxGroup
        legend="Buyer type"
        options={BUYER_TYPE_OPTIONS}
        selected={filters.buyerTypes}
        onToggle={(type) => apply({ buyerTypes: toggleValue(filters.buyerTypes, type) })}
      />
      <CheckboxGroup
        legend="Target country"
        options={countries}
        selected={filters.countries}
        onToggle={(code) => apply({ countries: toggleValue(filters.countries, code) })}
        renderLabel={(option) => (
          <span className="flex items-center gap-2">
            <span aria-hidden>{countryFlag(option.value)}</span>
            {option.label}
          </span>
        )}
      />
      <EuroRange
        legend="Ticket size (€)"
        noun="ticket"
        min={filters.ticketMin}
        max={filters.ticketMax}
        hint="Buyers whose ticket overlaps this range. A buyer without a limit is always included."
        submitLabel="Apply ticket"
        onApply={(ticketMin, ticketMax) => apply({ ticketMin, ticketMax })}
      />
      <p className="text-xs text-muted-foreground">
        Buyers open to any category or country match every category or country filter.
      </p>
      {hasActiveBuyerFilters(filters) && (
        <Button variant="outline" className="h-10 rounded-full" onClick={() => apply(clearedBuyerFilters(filters))}>
          Reset all filters
        </Button>
      )}
    </div>
  );
}
