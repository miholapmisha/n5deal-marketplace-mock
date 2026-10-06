"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AppErrorProps {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the segment (stable since Next.js 16.3; `reset` does not re-fetch). */
  retry: () => void;
}

/** Error boundary for signed-in screens. Server errors arrive here with only a digest. */
export default function AppError({ error, retry }: AppErrorProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-card">
      <TriangleAlert className="size-8 text-warning" aria-hidden />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page could not be loaded. Try again in a moment.
        {error.digest && <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => retry()} className="h-10 rounded-full px-5">
          Try again
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-full px-5">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
