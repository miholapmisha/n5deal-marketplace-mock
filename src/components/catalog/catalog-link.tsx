"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { LinkPendingMarker } from "@/components/filters/link-pending-marker";
import type { PageLinkProps } from "@/components/filters/pagination";
import {
  type CatalogFilters,
  catalogHref,
  clearedFilters,
  type ListFilterKey,
  withFilters,
  withoutValue,
} from "@/lib/catalog-filters";

type CatalogLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Filters to set. The page goes back to 1 unless the patch sets it. */
  patch?: Partial<CatalogFilters>;
  /** One value to take out of a multi-value filter (a chip's ×). */
  remove?: { key: ListFilterKey; value: string };
  /** Start from cleared filters (sort kept): "Reset all filters". */
  reset?: boolean;
};

/**
 * A catalog link whose href is built from the *optimistic* filters, so clicking a tab while
 * a checkbox change is still loading keeps that change. Still a plain `<a href>`: works
 * without JS, opens in a new tab, and dims the results while it navigates.
 */
export function CatalogLink({ patch, remove, reset = false, children, ...props }: CatalogLinkProps) {
  const { filters } = useCatalogNavigation();
  const base = reset ? clearedFilters(filters) : filters;
  const trimmed = remove ? withoutValue(base, remove.key, remove.value) : base;
  const href = catalogHref(withFilters(trimmed, patch ?? {}));

  return (
    <Link href={href} scroll={false} {...props}>
      {children}
      <LinkPendingMarker />
    </Link>
  );
}

/** Pagination: a page link scrolls to the top, since a new page is read from its first card. */
export function CatalogPageLink({ page, ...props }: PageLinkProps) {
  return <CatalogLink patch={{ page }} scroll {...props} />;
}
