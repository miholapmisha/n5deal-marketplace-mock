"use client";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { CheckboxGroup, type FilterOption } from "@/components/filters/checkbox-group";
import { EuroRange } from "@/components/filters/euro-range";
import { Button } from "@/components/ui/button";
import { BusinessStatus } from "@/generated/prisma/enums";
import { clearedFilters, hasActiveFilters, toggleValue } from "@/lib/catalog-filters";
import { countryFlag } from "@/lib/format";
import { BUSINESS_STATUS_LABELS } from "@/lib/labels";
import type { CatalogFacetOptions } from "@/server/assets/asset.service";

const BUSINESS_STATUS_OPTIONS: FilterOption<BusinessStatus>[] = Object.values(BusinessStatus).map((status) => ({
  value: status,
  label: BUSINESS_STATUS_LABELS[status],
}));

interface FilterPanelProps {
  options: CatalogFacetOptions;
}

export function FilterPanel({ options }: FilterPanelProps) {
  const { filters, apply } = useCatalogNavigation();

  return (
    <div className="flex flex-col gap-5">
      <CheckboxGroup
        legend="Country"
        options={options.countries}
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
        legend="Price (€)"
        noun="price"
        min={filters.priceMin}
        max={filters.priceMax}
        hint="A price filter hides “price on request” listings."
        submitLabel="Apply price"
        onApply={(priceMin, priceMax) => apply({ priceMin, priceMax })}
      />
      <CheckboxGroup
        legend="Business status"
        options={BUSINESS_STATUS_OPTIONS}
        selected={filters.businessStatuses}
        onToggle={(status) => apply({ businessStatuses: toggleValue(filters.businessStatuses, status) })}
      />
      <CheckboxGroup
        legend="License type"
        options={options.licenseTypes}
        selected={filters.licenseTypes}
        onToggle={(license) => apply({ licenseTypes: toggleValue(filters.licenseTypes, license) })}
      />
      <CheckboxGroup
        legend="Regulator"
        options={options.regulators}
        selected={filters.regulators}
        onToggle={(regulator) => apply({ regulators: toggleValue(filters.regulators, regulator) })}
      />
      {hasActiveFilters(filters) && (
        <Button variant="outline" className="h-10 rounded-full" onClick={() => apply(clearedFilters(filters))}>
          Reset all filters
        </Button>
      )}
    </div>
  );
}
