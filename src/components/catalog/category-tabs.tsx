import { cn } from "cn";

import { CatalogLink } from "@/components/catalog/catalog-link";
import { Category } from "@/generated/prisma/enums";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { CATEGORY_LABELS } from "@/lib/labels";

interface CategoryTabsProps {
  filters: CatalogFilters;
  counts: Record<Category, number>;
  allCount: number;
}

interface Tab {
  key: string;
  label: string;
  categories: Category[];
  count: number;
  active: boolean;
}

/**
 * The n5deal.com pill tabs. Counts are facet counts: they apply every other filter, so each
 * number is what you would get by clicking that tab. Real links: they work without JS.
 */
export function CategoryTabs({ filters, counts, allCount }: CategoryTabsProps) {
  const tabs: Tab[] = [
    { key: "ALL", label: "All", categories: [], count: allCount, active: filters.categories.length === 0 },
    ...Object.values(Category).map((category) => ({
      key: category,
      label: CATEGORY_LABELS[category],
      categories: [category],
      count: counts[category],
      active: filters.categories.includes(category),
    })),
  ];

  return (
    <nav aria-label="Asset categories" className="-mx-4 overflow-x-auto px-4 pb-1">
      <ul className="flex w-max gap-2">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <CatalogLink
              patch={{ categories: tab.categories }}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                tab.active
                  ? "border-pill bg-pill text-pill-foreground"
                  : "border-border bg-card hover:border-primary hover:text-primary",
              )}
            >
              {tab.label}
              <span className={cn("tabular-nums", !tab.active && "text-muted-foreground")}>({tab.count})</span>
            </CatalogLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
