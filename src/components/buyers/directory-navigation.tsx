"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useOptimistic, useTransition } from "react";
import { cn } from "cn";

import { type BuyerFilters, buyersHref, withBuyerFilters } from "@/lib/buyer-filters";

interface DirectoryNavigation {
  filters: BuyerFilters;
  isPending: boolean;
  apply: (patch: Partial<BuyerFilters>) => void;
}

const DirectoryNavigationContext = createContext<DirectoryNavigation | null>(null);

interface DirectoryNavigationProviderProps {
  filters: BuyerFilters;
  className?: string;
  children: ReactNode;
}

export function DirectoryNavigationProvider({ filters, className, children }: DirectoryNavigationProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<BuyerFilters>) {
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
