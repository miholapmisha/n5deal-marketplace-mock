"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useOptimistic, useTransition } from "react";
import { cn } from "cn";

import { type CatalogFilters, catalogHref, withFilters } from "@/lib/catalog-filters";

// One navigation state for every catalog control (search, sort, filter panel, drawer).
// The URL stays the source of truth: a control computes the next filters, the provider
// pushes the new URL inside a transition, and the server renders the new results.
// `useOptimistic` makes the control reflect the click at once; while the server works, a
// `data-pending` marker lets the results dim through CSS (`group-has-data-pending/catalog`).

interface CatalogNavigation {
  /** The filters including any change still on its way to the server. */
  filters: CatalogFilters;
  isPending: boolean;
  /** Applies the patch (back to page 1 unless the patch sets a page) and navigates. */
  apply: (patch: Partial<CatalogFilters>) => void;
}

const CatalogNavigationContext = createContext<CatalogNavigation | null>(null);

interface CatalogNavigationProviderProps {
  filters: CatalogFilters;
  className?: string;
  children: ReactNode;
}

/** Renders the `group/catalog` element that pending markers and dimmed results live in. */
export function CatalogNavigationProvider({ filters, className, children }: CatalogNavigationProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<CatalogFilters>) {
    // Built on the optimistic state, so two quick clicks both end up in the URL.
    const next = withFilters(optimisticFilters, patch);
    startTransition(() => {
      setOptimisticFilters(next);
      router.push(catalogHref(next), { scroll: false });
    });
  }

  return (
    <CatalogNavigationContext value={{ filters: optimisticFilters, isPending, apply }}>
      <div className={cn("group/catalog", className)}>
        {isPending && <span hidden data-pending="" />}
        {children}
      </div>
    </CatalogNavigationContext>
  );
}

export function useCatalogNavigation(): CatalogNavigation {
  const navigation = use(CatalogNavigationContext);
  if (!navigation) throw new Error("useCatalogNavigation must be used inside <CatalogNavigationProvider>.");
  return navigation;
}
