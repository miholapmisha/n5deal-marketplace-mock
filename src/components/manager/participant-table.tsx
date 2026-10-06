import Link from "next/link";

import { UserModerationButton } from "@/components/manager/moderation-buttons";
import { UserStatusBadge } from "@/components/manager/user-status-badge";
import type { AssetStatus } from "@/generated/prisma/enums";
import { formatDate, formatTicketRange } from "@/lib/format";
import { BUYER_TYPE_LABELS } from "@/lib/labels";
import { DEFAULT_MANAGER_ASSET_FILTERS, managerAssetsHref, type ParticipantRole } from "@/lib/manager-filters";
import type { ParticipantRow, ParticipantSummary } from "@/server/moderation/moderation.service";

const headClass = "px-4 py-3 font-medium whitespace-nowrap";
const cellClass = "px-4 py-3 align-top";

interface ParticipantTableProps {
  role: ParticipantRole;
  participants: ParticipantRow[];
}

export function ParticipantTable({ role, participants }: ParticipantTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full min-w-5xl text-left text-sm">
        <thead className="border-b border-row-border bg-muted text-xs text-muted-foreground">
          <tr>
            <th scope="col" className={headClass}>
              Name
            </th>
            <th scope="col" className={headClass}>
              Company
            </th>
            <th scope="col" className={headClass}>
              Email
            </th>
            <th scope="col" className={headClass}>
              Status
            </th>
            <th scope="col" className={headClass}>
              Joined
            </th>
            <th scope="col" className={headClass}>
              {role === "BUYER" ? "Profile" : "Assets"}
            </th>
            <th scope="col" className={`${headClass} text-right`}>
              Conversations
            </th>
            <th scope="col" className={`${headClass} text-right`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-row-border">
          {participants.map((participant) => (
            <ParticipantRowView key={participant.id} participant={participant} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticipantRowView({ participant }: { participant: ParticipantRow }) {
  const removed = participant.status === "REMOVED";
  const displayName = participant.companyName ?? participant.name;

  return (
    <tr>
      <td className={`${cellClass} max-w-48 font-medium`}>
        <span className="line-clamp-2">{participant.name}</span>
      </td>
      <td className={`${cellClass} max-w-48`}>
        <span className="line-clamp-2">{participant.companyName ?? <span className="text-muted-foreground">—</span>}</span>
      </td>
      <td className={`${cellClass} max-w-56`}>
        {removed ? (
          <span className="text-muted-foreground">Erased</span>
        ) : (
          <span className="block truncate" title={participant.email}>
            {participant.email}
          </span>
        )}
      </td>
      <td className={`${cellClass} max-w-60`}>
        <div className="flex flex-col items-start gap-1">
          <UserStatusBadge status={participant.status} />
          {participant.statusReason && participant.status !== "ACTIVE" && (
            <span title={participant.statusReason} className="line-clamp-2 text-xs text-muted-foreground">
              {participant.statusReason}
            </span>
          )}
        </div>
      </td>
      <td className={`${cellClass} whitespace-nowrap text-muted-foreground`}>{formatDate(participant.createdAt)}</td>
      <td className={`${cellClass} max-w-56`}>
        <Summary userId={participant.id} summary={participant.summary} />
      </td>
      <td className={`${cellClass} text-right tabular-nums`}>{participant.conversations}</td>
      <td className={cellClass}>
        <div className="flex justify-end gap-1.5 whitespace-nowrap">
          {participant.actions.length === 0 && <span className="text-muted-foreground">—</span>}
          {participant.actions.map((action) => (
            <UserModerationButton
              key={action}
              userId={participant.id}
              displayName={displayName}
              action={action}
              confirmText={participant.removalConfirmation}
            />
          ))}
        </div>
      </td>
    </tr>
  );
}

const ASSET_COUNT_ORDER: { status: AssetStatus; label: string }[] = [
  { status: "PUBLISHED", label: "published" },
  { status: "DRAFT", label: "draft" },
  { status: "HIDDEN", label: "hidden" },
  { status: "REMOVED", label: "removed" },
];

function Summary({ userId, summary }: { userId: string; summary: ParticipantSummary }) {
  if (summary.kind === "buyer") {
    const { profile } = summary;
    if (!profile) return <span className="text-muted-foreground">No profile yet</span>;
    return (
      <span className="flex flex-col">
        <span>{BUYER_TYPE_LABELS[profile.buyerType]}</span>
        <span className="text-xs text-muted-foreground">
          {formatTicketRange(profile.ticketMinEur, profile.ticketMaxEur)}
          {!profile.isVisible && " · hidden from sellers"}
        </span>
      </span>
    );
  }

  const parts = ASSET_COUNT_ORDER.flatMap(({ status, label }) => {
    const count = summary.assets[status];
    return count ? [`${count} ${label}`] : [];
  });
  if (parts.length === 0) return <span className="text-muted-foreground">No assets</span>;
  return (
    <Link
      href={managerAssetsHref({ ...DEFAULT_MANAGER_ASSET_FILTERS, seller: userId })}
      className="hover:text-primary hover:underline"
    >
      {parts.join(" · ")}
    </Link>
  );
}
