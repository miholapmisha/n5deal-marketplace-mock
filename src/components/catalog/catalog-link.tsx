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
  patch?: Partial<CatalogFilters>;
  remove?: { key: ListFilterKey; value: string };
  reset?: boolean;
};

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

export function CatalogPageLink({ page, ...props }: PageLinkProps) {
  return <CatalogLink patch={{ page }} scroll {...props} />;
}
