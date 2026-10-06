"use client";

import { useLinkStatus } from "next/link";

/**
 * Place inside a filter `<Link>` (catalog, buyer directory): while that navigation is
 * pending it renders the same `data-pending` marker as the filter controls, so the results
 * dim for links too.
 */
export function LinkPendingMarker() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-pending="" /> : null;
}
