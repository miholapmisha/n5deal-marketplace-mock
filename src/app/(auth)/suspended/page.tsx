import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { readSuspendedNotice } from "@/server/auth/suspended-notice";

export const metadata: Metadata = {
  title: "Account suspended",
};

export default async function SuspendedPage() {
  const reason = await readSuspendedNotice();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Your account is suspended</h1>
        <p className="text-muted-foreground">
          {reason
            ? "A platform manager suspended this account. While it is suspended you cannot log in, and your listings and profile are hidden from other users."
            : "Suspended accounts cannot log in. Log in again to see the reason for a suspension."}
        </p>
      </div>
      {reason && (
        <div className="w-full rounded-xl bg-row p-4 text-left">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Reason</p>
          <p className="mt-1 text-body">{reason}</p>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        If you think this is a mistake, contact the N5Deal team to have your account reviewed.
      </p>
      <Button asChild variant="outline" size="lg">
        <Link href="/assets">Back to listings</Link>
      </Button>
    </div>
  );
}
