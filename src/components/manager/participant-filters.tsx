"use client";

import { SearchBox } from "@/components/filters/search-box";
import { type SelectOption, SelectFilter } from "@/components/filters/select-filter";
import { useFilterNavigation } from "@/components/filters/use-filter-navigation";
import { UserStatus } from "@/generated/prisma/enums";
import { USER_STATUS_LABELS } from "@/lib/labels";
import { type ParticipantFilters as Filters, participantsHref } from "@/lib/manager-filters";

const STATUS_OPTIONS: SelectOption<UserStatus>[] = Object.values(UserStatus).map((value) => ({
  value,
  label: USER_STATUS_LABELS[value],
}));

export function ParticipantFilters({ filters }: { filters: Filters }) {
  const { filters: current, isPending, apply } = useFilterNavigation(filters, participantsHref);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      {isPending && <span hidden data-pending="" />}
      <div className="flex min-w-0 flex-1">
        <SearchBox
          query={current.q}
          onSearch={(q) => apply({ q })}
          placeholder="Search by name, email, or company…"
          label="Search participants"
        />
      </div>
      <div className="md:w-48">
        <SelectFilter
          id="filter-user-status"
          label="Status"
          value={current.status}
          options={STATUS_OPTIONS}
          allLabel="All statuses"
          onChange={(status) => apply({ status })}
        />
      </div>
    </div>
  );
}
