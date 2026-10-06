import { Construction } from "lucide-react";

import { ROLE_LABELS } from "@/lib/labels";
import type { CurrentUser } from "@/server/auth/session";

interface PlaceholderPageProps {
  title: string;
  milestone: string;
  user: CurrentUser;
}

/** A guarded route whose screen is built in a later milestone (SPEC §12). */
export function PlaceholderPage({ title, milestone, user }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
        <Construction className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">This screen is built in milestone {milestone}.</p>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.name} ({ROLE_LABELS[user.role]}).
        </p>
      </div>
    </div>
  );
}
