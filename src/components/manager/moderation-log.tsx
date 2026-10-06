import Link from "next/link";
import { cn } from "cn";

import { LocalTime } from "@/components/messaging/local-time";
import { Badge } from "@/components/ui/badge";
import type { ModerationAction } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/labels";
import { MODERATION_ACTION_LABELS } from "@/lib/moderation";
import type { ModerationLogEntry, ModerationTarget } from "@/server/moderation/moderation.service";

const ACTION_CLASSES: Record<ModerationAction, string> = {
  SUSPEND_USER: "border-warning/30 bg-warning/10 text-warning",
  HIDE_ASSET: "border-warning/30 bg-warning/10 text-warning",
  REINSTATE_USER: "border-success/30 bg-success/10 text-success",
  UNHIDE_ASSET: "border-success/30 bg-success/10 text-success",
  REMOVE_USER: "border-destructive/30 bg-destructive/10 text-destructive",
  REMOVE_ASSET: "border-destructive/30 bg-destructive/10 text-destructive",
};

const headClass = "px-4 py-3 font-medium whitespace-nowrap";
const cellClass = "px-4 py-3 align-top";

/** S10: the newest moderation actions — when, who, what, on whom, and why. */
export function ModerationLog({ entries }: { entries: ModerationLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-row-border bg-card p-6 text-center text-sm text-muted-foreground">
        No moderation actions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="border-b border-row-border bg-muted text-xs text-muted-foreground">
          <tr>
            <th scope="col" className={headClass}>
              When
            </th>
            <th scope="col" className={headClass}>
              Manager
            </th>
            <th scope="col" className={headClass}>
              Action
            </th>
            <th scope="col" className={headClass}>
              Target
            </th>
            <th scope="col" className={headClass}>
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-border">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className={`${cellClass} whitespace-nowrap text-muted-foreground`}>
                <LocalTime date={entry.createdAt} variant="message" />
              </td>
              <td className={`${cellClass} whitespace-nowrap`}>{entry.managerName}</td>
              <td className={cellClass}>
                <Badge variant="outline" className={cn("h-6 px-2.5", ACTION_CLASSES[entry.action])}>
                  {MODERATION_ACTION_LABELS[entry.action]}
                </Badge>
              </td>
              <td className={`${cellClass} max-w-56`}>
                <Target target={entry.target} />
              </td>
              <td className={`${cellClass} max-w-md text-muted-foreground`}>
                <span title={entry.reason} className="line-clamp-3">
                  {entry.reason}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Target({ target }: { target: ModerationTarget | null }) {
  if (!target) return <span className="text-muted-foreground">—</span>;
  if (target.kind === "asset") {
    return (
      <Link href={`/assets/${target.slug}`} className="line-clamp-2 font-medium hover:text-primary">
        {target.label}
      </Link>
    );
  }
  return (
    <span className="flex flex-col">
      <span className="line-clamp-2 font-medium">{target.label}</span>
      <span className="text-xs text-muted-foreground">{ROLE_LABELS[target.role]}</span>
    </span>
  );
}
