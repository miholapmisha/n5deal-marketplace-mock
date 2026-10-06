"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useOptimistic, useTransition } from "react";
import { cn } from "cn";

import { type BuyerFilters, buyersHref, withBuyerFilters } from "@/lib/buyer-filters";

// The buyer directory's counterpart of CatalogNavigationProvider: the URL is the source of
// truth, controls patch the optimistic filters and push the new URL inside a transition,
// and a `data-pending` marker dims the results (`group-has-data-pending/buyers`).

interface DirectoryNavigation {
  /** The filters including any change still on its way to the server. */
  filters: BuyerFilters;
  isPending: boolean;
  /** Applies the patch (back to page 1 unless the patch sets a page) and navigates. */
  apply: (patch: Partial<BuyerFilters>) => void;
}

const DirectoryNavigationContext = createContext<DirectoryNavigation | null>(null);

interface DirectoryNavigationProviderProps {
  filters: BuyerFilters;
  className?: string;
  children: ReactNode;
}

/** Renders the `group/buyers` element that pending markers and dimmed results live in. */
export function DirectoryNavigationProvider({ filters, className, children }: DirectoryNavigationProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<BuyerFilters>) {
    // Built on the optimistic state, so two quick clicks both end up in the URL.
    const next = withBuyerFilters(optimisticFilters, patch);
    startTransition(() => {
      setOptimisticFilters(next);
      router.push(buyersHref(next), { scroll: false });
    });
  }

  return (
    <DirectoryNavigationContext value={{ filters: optimisticFilters, isPending, apply }}>
      <div className={cn("group/buyers", className)}>
        {isPending && <span hidden data-pending="" />}
        {children}
      </div>
    </DirectoryNavigationContext>
  );
}

export function useDirectoryNavigation(): DirectoryNavigation {
  const navigation = use(DirectoryNavigationContext);
  if (!navigation) throw new Error("useDirectoryNavigation must be used inside <DirectoryNavigationProvider>.");
  return navigation;
}
