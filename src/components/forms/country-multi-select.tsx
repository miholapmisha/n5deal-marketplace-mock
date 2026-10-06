"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { CountryOption } from "@/lib/countries";
import { countryFlag } from "@/lib/format";

interface CountryMultiSelectProps {
  id: string;
  options: readonly CountryOption[];
  values: string[];
  onChange: (values: string[]) => void;
  emptyLabel: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function CountryMultiSelect({ id, options, values, onChange, emptyLabel, ...aria }: CountryMultiSelectProps) {
  const listId = useId();
  const labelOf = (code: string) => options.find((option) => option.value === code)?.label ?? code;
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle) || option.value.toLowerCase() === needle)
    : options;

  const toggle = (code: string) =>
    onChange(values.includes(code) ? values.filter((value) => value !== code) : [...values, code]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-input bg-card p-2 has-aria-invalid:border-destructive">
      <div className="flex min-h-7 flex-wrap gap-1.5" aria-live="polite">
        {values.length === 0 && <span className="px-1 py-1 text-sm text-muted-foreground">{emptyLabel}</span>}
        {values.map((code) => (
          <Badge key={code} variant="secondary" className="h-7 gap-1 pr-1 text-sm font-normal">
            <span aria-hidden>{countryFlag(code)}</span>
            {labelOf(code)}
            <button
              type="button"
              onClick={() => toggle(code)}
              aria-label={`Remove ${labelOf(code)}`}
              className="rounded-full p-0.5 hover:bg-background"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </Badge>
        ))}
      </div>
      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search countries"
        aria-controls={listId}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        {...aria}
      />
      <ul id={listId} className="flex max-h-52 flex-col overflow-y-auto">
        {visible.map((option) => (
          <li key={option.value}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={values.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="size-4 accent-primary"
              />
              <span aria-hidden>{countryFlag(option.value)}</span>
              {option.label}
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">No matches.</li>}
      </ul>
    </div>
  );
}
