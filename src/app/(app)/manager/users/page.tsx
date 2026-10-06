import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cn } from "cn";

import { FilterLink, HrefPageLink } from "@/components/filters/filter-link";
import { Pagination } from "@/components/filters/pagination";
import { ParticipantFilters } from "@/components/manager/participant-filters";
import { ParticipantTable } from "@/components/manager/participant-table";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PARTICIPANT_FILTERS,
  hasParticipantFilters,
  MANAGER_PAGE_SIZE,
  type ParticipantFilters as Filters,
  type ParticipantRole,
  participantsHref,
} from "@/lib/manager-filters";
import { parseParticipantFilters } from "@/lib/parse-manager-filters";
import { requireRole } from "@/server/auth/guards";
import { listParticipants, type ParticipantPage } from "@/server/moderation/moderation.service";

export const metadata: Metadata = {
  title: "Participants",
};

const TABS: { role: ParticipantRole; label: string; noun: [string, string] }[] = [
  { role: "BUYER", label: "Buyers", noun: ["buyer", "buyers"] },
  { role: "SELLER", label: "Sellers", noun: ["seller", "sellers"] },
];

// S11. Buyers and sellers with their status and activity; suspend, reinstate, or remove.
// Managers are not listed: they cannot be moderated (SPEC §4.3).
export default async function ParticipantsPage({ searchParams }: PageProps<"/manager/users">) {
  await requireRole("MANAGER");
  const requested = parseParticipantFilters(await searchParams);
  const result = await listParticipants(requested);
  if (!result) notFound();
  const filters: Filters = { ...requested, page: result.page };
  const [singular, plural] = TABS.find((tab) => tab.role === filters.role)?.noun ?? ["account", "accounts"];

  const first = (result.page - 1) * MANAGER_PAGE_SIZE + 1;
  const last = first + result.participants.length - 1;

  return (
    <div className="group/manager flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Participants</h1>
        <p className="text-muted-foreground">
          Suspend an account to log it out and hide its content until it is reinstated; removal is permanent.
        </p>
      </header>

      <RoleTabs filters={filters} counts={result.counts} />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
        <ParticipantFilters filters={filters} />
      </div>

      <div className="flex flex-col gap-4 transition-opacity group-has-data-pending/manager:opacity-50">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {result.total === 0
            ? `No ${plural} found`
            : `Showing ${first}–${last} of ${result.total} ${result.total === 1 ? singular : plural}`}
        </p>
        {result.participants.length === 0 ? (
          <EmptyState filters={filters} plural={plural} />
        ) : (
          <ParticipantTable role={filters.role} participants={result.participants} />
        )}
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          PageLink={({ page, ...props }) => <HrefPageLink href={participantsHref({ ...filters, page })} {...props} />}
        />
      </div>
    </div>
  );
}

/** Pill tabs like the catalog's; switching keeps the search and status filter. */
function RoleTabs({ filters, counts }: { filters: Filters; counts: ParticipantPage["counts"] }) {
  return (
    <nav aria-label="Participant type">
      <ul className="flex gap-2">
        {TABS.map((tab) => {
          const active = tab.role === filters.role;
          return (
            <li key={tab.role}>
              <FilterLink
                href={participantsHref({ ...filters, role: tab.role, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-pill bg-pill text-pill-foreground"
                    : "border-border bg-card hover:border-primary hover:text-primary",
                )}
              >
                {tab.label}
                <span className={cn("tabular-nums", !active && "text-muted-foreground")}>({counts[tab.role]})</span>
              </FilterLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EmptyState({ filters, plural }: { filters: Filters; plural: string }) {
  const filtered = hasParticipantFilters(filters);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-row-border bg-card p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{filtered ? `No ${plural} match these filters` : `No ${plural} have registered yet.`}</p>
      {filtered && (
        <Button asChild className="h-10 rounded-full px-5">
          <FilterLink href={participantsHref({ ...DEFAULT_PARTICIPANT_FILTERS, role: filters.role })}>
            Reset filters
          </FilterLink>
        </Button>
      )}
    </div>
  );
}
