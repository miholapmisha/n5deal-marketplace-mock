"use client";

import { selectClass } from "@/components/forms/field";
import { Label } from "@/components/ui/label";

export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface SelectFilterProps<V extends string> {
  id: string;
  label: string;
  /** The applied value, or null for "all". */
  value: V | null;
  options: readonly SelectOption<V>[];
  /** The label of the empty option, e.g. "All countries". */
  allLabel: string;
  onChange: (value: V | null) => void;
}

/** A single-value filter as a native select (free keyboard and mobile pickers). */
export function SelectFilter<V extends string>({ id, label, value, options, allLabel, onChange }: SelectFilterProps<V>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <select
        id={id}
        value={value ?? ""}
        // Looked up rather than cast: only a listed option can become a filter.
        onChange={(event) => onChange(options.find((option) => option.value === event.target.value)?.value ?? null)}
        className={selectClass}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
