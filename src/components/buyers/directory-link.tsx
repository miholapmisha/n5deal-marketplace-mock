"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useDirectoryNavigation } from "@/components/buyers/directory-navigation";
import { LinkPendingMarker } from "@/components/filters/link-pending-marker";
import type { PageLinkProps } from "@/components/filters/pagination";
import { type BuyerFilters, buyersHref, clearedBuyerFilters, withBuyerFilters } from "@/lib/buyer-filters";

type DirectoryLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  patch?: Partial<BuyerFilters>;
  reset?: boolean;
};

export function DirectoryLink({ patch, reset = false, children, ...props }: DirectoryLinkProps) {
  const { filters } = useDirectoryNavigation();
  const base = reset ? clearedBuyerFilters(filters) : filters;

  return (
    <Link href={buyersHref(withBuyerFilters(base, patch ?? {}))} scroll={false} {...props}>
      {children}
      <LinkPendingMarker />
    </Link>
  );
}

export function DirectoryPageLink({ page, ...props }: PageLinkProps) {
  return <DirectoryLink patch={{ page }} scroll {...props} />;
}
