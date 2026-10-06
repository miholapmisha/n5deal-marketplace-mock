"use client";

import { type FocusEvent, type FormEvent, type ReactNode, useId, useState } from "react";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BusinessStatus } from "@/generated/prisma/enums";
import { clearedFilters, hasActiveFilters, parsePriceInput, toggleValue } from "@/lib/catalog-filters";
import { countryFlag } from "@/lib/format";
import { BUSINESS_STATUS_LABELS } from "@/lib/labels";
import type { CatalogFacetOptions } from "@/server/assets/asset.service";

/** Above this many options a group gets its own search box. */
const SEARCHABLE_FROM = 8;

interface Option<T extends string> {
  value: T;
  label: string;
}

const BUSINESS_STATUS_OPTIONS: Option<BusinessStatus>[] = Object.values(BusinessStatus).map((status) => ({
  value: status,
  label: BUSINESS_STATUS_LABELS[status],
}));

interface FilterPanelProps {
  options: CatalogFacetOptions;
}

/** Side panel on desktop, drawer content on mobile. Every change applies immediately. */
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
      <PriceRange />
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

interface CheckboxGroupProps<T extends string> {
  legend: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  renderLabel?: (option: Option<T>) => ReactNode;
}

function CheckboxGroup<T extends string>({ legend, options, selected, onToggle, renderLabel }: CheckboxGroupProps<T>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const searchable = options.length > SEARCHABLE_FROM;
  const needle = query.trim().toLowerCase();
  // Checked options stay visible while searching, so a selection never "disappears".
  const visible = needle
    ? options.filter((option) => selected.includes(option.value) || option.label.toLowerCase().includes(needle))
    : options;

  return (
    <section aria-labelledby={`${id}-legend`} className="flex flex-col gap-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 id={`${id}-legend`} className="text-sm font-semibold">
        {legend}
        {selected.length > 0 && <span className="ml-1.5 font-normal text-muted-foreground">({selected.length})</span>}
      </h3>
      {searchable && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${legend.toLowerCase()}`}
          aria-label={`Search ${legend.toLowerCase()} options`}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
        {visible.map((option) => {
          const optionId = `${id}-${options.indexOf(option)}`;
          return (
            <li key={option.value} className="flex items-center gap-2.5">
              <Checkbox
                id={optionId}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <label htmlFor={optionId} className="cursor-pointer text-sm leading-tight">
                {renderLabel ? renderLabel(option) : option.label}
              </label>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
    </section>
  );
}

function priceText(value: number | null): string {
  return value === null ? "" : String(value);
}

/** Two typed bounds, applied together on submit (typing must not navigate per keystroke). */
function PriceRange() {
  const { filters, apply } = useCatalogNavigation();
  const id = useId();
  const [min, setMin] = useState(priceText(filters.priceMin));
  const [max, setMax] = useState(priceText(filters.priceMax));
  const [error, setError] = useState<string | null>(null);
  // Follow the URL when the range changes elsewhere (a removed chip, "Reset all filters").
  const urlRange = `${filters.priceMin}:${filters.priceMax}`;
  const [syncedRange, setSyncedRange] = useState(urlRange);
  if (urlRange !== syncedRange) {
    setSyncedRange(urlRange);
    setMin(priceText(filters.priceMin));
    setMax(priceText(filters.priceMax));
    setError(null);
  }

  /** Validates both bounds and navigates if they differ from the URL. */
  function commit() {
    const low = min.trim() ? parsePriceInput(min) : null;
    const high = max.trim() ? parsePriceInput(max) : null;
    if ((min.trim() && low === null) || (max.trim() && high === null)) {
      setError("Enter whole euros, e.g. 500000.");
      return;
    }
    setError(null);
    const reversed = low !== null && high !== null && low > high;
    // €0 as a minimum is no bound; it would only hide "price on request" listings.
    const priceMin = (reversed ? high : low) || null;
    const priceMax = reversed ? low : high;
    if (priceMin !== filters.priceMin || priceMax !== filters.priceMax) apply({ priceMin, priceMax });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit();
  }

  // Leaving the price fields also applies them, so closing the mobile drawer (or clicking
  // anywhere else) never silently drops a typed price.
  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) commit();
  }

  const inputClass =
    "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

  return (
    <section aria-labelledby={`${id}-legend`} className="flex flex-col gap-2.5 border-t border-border pt-4">
      <h3 id={`${id}-legend`} className="text-sm font-semibold">
        Price (€)
      </h3>
      <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            placeholder="Min"
            aria-label="Minimum price in euros"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={inputClass}
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <input
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            placeholder="Max"
            aria-label="Maximum price in euros"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={inputClass}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">A price filter hides “price on request” listings.</p>
        <Button type="submit" variant="secondary" className="h-9 rounded-full">
          Apply price
        </Button>
      </form>
    </section>
  );
}
