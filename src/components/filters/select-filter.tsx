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
  value: V | null;
  options: readonly SelectOption<V>[];
  allLabel: string;
  onChange: (value: V | null) => void;
}

export function SelectFilter<V extends string>({ id, label, value, options, allLabel, onChange }: SelectFilterProps<V>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <select
        id={id}
        value={value ?? ""}
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
