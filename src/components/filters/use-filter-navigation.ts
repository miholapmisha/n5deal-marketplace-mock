"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

interface FilterNavigation<T> {
  filters: T;
  isPending: boolean;
  apply: (patch: Partial<T>) => void;
}

export function useFilterNavigation<T extends { page: number }>(
  filters: T,
  toHref: (filters: T) => string,
): FilterNavigation<T> {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<T>) {
    const next: T = { ...optimisticFilters, page: 1, ...patch };
    startTransition(() => {
      setOptimisticFilters(next);
      router.push(toHref(next), { scroll: false });
    });
  }

  return { filters: optimisticFilters, isPending, apply };
}
