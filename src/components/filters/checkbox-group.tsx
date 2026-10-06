"use client";

import { type ReactNode, useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

const SEARCHABLE_FROM = 8;

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface CheckboxGroupProps<T extends string> {
  legend: string;
  options: FilterOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  renderLabel?: (option: FilterOption<T>) => ReactNode;
}

export function CheckboxGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  renderLabel,
}: CheckboxGroupProps<T>) {
  const id = useId();
  const [query, setQuery] = useState("");
  const searchable = options.length > SEARCHABLE_FROM;
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => selected.includes(option.value) || option.label.toLowerCase().includes(needle))
    : options;

  return (
    <section aria-labelledby={`${id}-legend`} className="flex flex-col gap-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 id={`${id}-legend`} className="text-sm font-semibold">
        {legend}
        {selected.length > 0 && <span className="ml-1.5 font-normal text-muted-foreground">({selected.length})</span>}
      </h3>
      {searchable && (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${legend.toLowerCase()}`}
          aria-label={`Search ${legend.toLowerCase()} options`}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}
      <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
        {visible.map((option) => {
          const optionId = `${id}-${options.indexOf(option)}`;
          return (
            <li key={option.value} className="flex items-center gap-2.5">
              <Checkbox
                id={optionId}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <label htmlFor={optionId} className="cursor-pointer text-sm leading-tight">
                {renderLabel ? renderLabel(option) : option.label}
              </label>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="text-sm text-muted-foreground">No matches.</p>}
    </section>
  );
}
