"use client";

import { ChevronDown } from "lucide-react";

import { useDirectoryNavigation } from "@/components/buyers/directory-navigation";
import type { RankOption } from "@/server/buyers/buyer.service";

const NO_RANKING = "";

interface RankSelectProps {
  options: RankOption[];
}

export function RankSelect({ options }: RankSelectProps) {
  const { filters, apply } = useDirectoryNavigation();
  const value = options.some((option) => option.id === filters.rank) ? (filters.rank ?? NO_RANKING) : NO_RANKING;

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">Rank for</span>
      <span className="relative min-w-0">
        <select
          value={value}
          onChange={(event) => apply({ rank: event.target.value || null })}
          className="h-10 w-full max-w-72 appearance-none truncate rounded-full border border-input bg-card pr-9 pl-4 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value={NO_RANKING}>No ranking (recently active first)</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </span>
    </label>
  );
}
