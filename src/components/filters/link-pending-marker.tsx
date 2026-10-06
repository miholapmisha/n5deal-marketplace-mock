"use client";

import { useLinkStatus } from "next/link";

export function LinkPendingMarker() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-pending="" /> : null;
}
