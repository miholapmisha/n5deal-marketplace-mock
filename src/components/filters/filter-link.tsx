import Link from "next/link";
import type { ComponentProps } from "react";

import { LinkPendingMarker } from "@/components/filters/link-pending-marker";
import type { PageLinkProps } from "@/components/filters/pagination";

export function FilterLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link scroll={false} {...props}>
      {children}
      <LinkPendingMarker />
    </Link>
  );
}

export function HrefPageLink({ href, ...props }: Omit<PageLinkProps, "page"> & { href: string }) {
  return <FilterLink href={href} scroll {...props} />;
}
