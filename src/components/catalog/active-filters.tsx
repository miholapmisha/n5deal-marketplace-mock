import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { CatalogLink } from "@/components/catalog/catalog-link";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { countryName, formatPrice } from "@/lib/format";
import { BUSINESS_STATUS_LABELS, CATEGORY_LABELS } from "@/lib/labels";
import { REGION_LABELS, regionOf } from "@/lib/regions";

type Chip = { key: string; label: string } & Pick<ComponentProps<typeof CatalogLink>, "patch" | "remove">;

const MAX_COUNTRY_CHIPS = 4;

function priceLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  return min !== null ? `From ${formatPrice(min)}` : `Up to ${formatPrice(max)}`;
}

function countryChips(countries: string[]): Chip[] {
  if (countries.length === 0) return [];
  const region = regionOf(countries);
  if (region) return [{ key: `region:${region}`, label: REGION_LABELS[region], patch: { countries: [] } }];
  if (countries.length > MAX_COUNTRY_CHIPS) {
    return [{ key: "countries", label: `${countries.length} countries`, patch: { countries: [] } }];
  }
  return countries.map((code) => ({
    key: `country:${code}`,
    label: countryName(code),
    remove: { key: "countries" as const, value: code },
  }));
}

function chipsFor(filters: CatalogFilters): Chip[] {
  return [
    ...filters.categories.map((category) => ({
      key: `category:${category}`,
      label: CATEGORY_LABELS[category],
      remove: { key: "categories" as const, value: category },
    })),
    ...countryChips(filters.countries),
    ...(filters.priceMin !== null || filters.priceMax !== null
      ? [
          {
            key: "price",
            label: priceLabel(filters.priceMin, filters.priceMax),
            patch: { priceMin: null, priceMax: null },
          },
        ]
      : []),
    ...filters.businessStatuses.map((status) => ({
      key: `status:${status}`,
      label: BUSINESS_STATUS_LABELS[status],
      remove: { key: "businessStatuses" as const, value: status },
    })),
    ...filters.licenseTypes.map((license) => ({
      key: `license:${license}`,
      label: license,
      remove: { key: "licenseTypes" as const, value: license },
    })),
    ...filters.regulators.map((regulator) => ({
      key: `regulator:${regulator}`,
      label: regulator,
      remove: { key: "regulators" as const, value: regulator },
    })),
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, patch: { q: null } }] : []),
  ];
}

export function ActiveFilters({ filters }: { filters: CatalogFilters }) {
  const chips = chipsFor(filters);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex flex-wrap gap-2" aria-label="Active filters">
        {chips.map(({ key, label, patch, remove }) => (
          <li key={key}>
            <CatalogLink
              patch={patch}
              remove={remove}
              aria-label={`Remove filter: ${label}`}
              className="flex h-8 max-w-64 items-center gap-1.5 rounded-full border border-row-border bg-card pr-2 pl-3 text-sm hover:border-primary hover:text-primary"
            >
              <span className="truncate">{label}</span>
              <X className="size-3.5 shrink-0" aria-hidden />
            </CatalogLink>
          </li>
        ))}
      </ul>
      <CatalogLink reset className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        Clear all
      </CatalogLink>
    </div>
  );
}
