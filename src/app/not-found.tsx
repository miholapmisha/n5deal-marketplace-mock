import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Unknown URLs and anything `notFound()` hides, e.g. an asset this viewer may not see. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page does not exist, or the listing is no longer available.
        </p>
        <Button asChild className="h-10 rounded-full px-5">
          <Link href="/assets">Browse all listings</Link>
        </Button>
      </div>
    </main>
  );
}
