"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

interface FilterNavigation<T> {
  /** The filters including any change still on its way to the server. */
  filters: T;
  isPending: boolean;
  /** Applies the patch (back to page 1 unless the patch sets a page) and navigates. */
  apply: (patch: Partial<T>) => void;
}

/**
 * URL-backed filters for one control bar: the URL is the source of truth, a change patches
 * the optimistic filters and pushes `toHref(next)` inside a transition. Render a
 * `data-pending` marker while `isPending` to dim the results.
 */
export function useFilterNavigation<T extends { page: number }>(
  filters: T,
  toHref: (filters: T) => string,
): FilterNavigation<T> {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);

  function apply(patch: Partial<T>) {
    // Built on the optimistic state, so two quick changes both end up in the URL.
    const next: T = { ...optimisticFilters, page: 1, ...patch };
    startTransition(() => {
      setOptimisticFilters(next);
      router.push(toHref(next), { scroll: false });
    });
  }

  return { filters: optimisticFilters, isPending, apply };
}
