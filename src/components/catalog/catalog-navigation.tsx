"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useOptimistic, useTransition } from "react";
import { cn } from "cn";

import { type CatalogFilters, catalogHref, withFilters } from "@/lib/catalog-filters";

interface CatalogNavigation {
  filters: CatalogFilters;
  isPending: boolean;
  apply: (patch: Partial<CatalogFilters>) => void;
}

const CatalogNavigationContext = createContext<CatalogNavigation | null>(null);

interface CatalogNavigationProviderProps {
  filters: CatalogFilters;
  className?: string;
  children: ReactNode;
}

export function CatalogNavigationProvider({ filters, className, children }: CatalogNavigationProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<CatalogFilters>) {
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
