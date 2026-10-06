"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { panelFilterCount } from "@/lib/catalog-filters";
import type { CatalogFacetOptions } from "@/server/assets/asset.service";

interface FilterDrawerProps {
  options: CatalogFacetOptions;
  /** Results for the current URL; refreshes as each change lands. */
  total: number;
}

/** Mobile: the filter panel in a drawer. Hidden from `lg` up, where the side panel shows. */
export function FilterDrawer({ options, total }: FilterDrawerProps) {
  const { filters, isPending } = useCatalogNavigation();
  const count = panelFilterCount(filters);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 rounded-full bg-card px-4 lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filters
          {count > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          <SheetDescription>Changes apply as you make them.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel options={options} />
        </div>
        <SheetFooter className="border-t border-border">
          <SheetClose asChild>
            <Button className="h-10 w-full rounded-full" aria-busy={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Updating…
                </>
              ) : (
                `Show ${total} ${total === 1 ? "result" : "results"}`
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
