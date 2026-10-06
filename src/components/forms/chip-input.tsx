"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";

interface ChipInputProps {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxItems: number;
  maxLength: number;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function ChipInput({ id, values, onChange, maxItems, maxLength, placeholder, ...aria }: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const full = values.length >= maxItems;

  function add() {
    const chip = draft.trim().replace(/\s+/g, " ");
    setDraft("");
    if (!chip || full || values.some((value) => value.toLowerCase() === chip.toLowerCase())) return;
    onChange([...values, chip]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="h-7 gap-1 pr-1 text-sm font-normal">
          {value}
          <button
            type="button"
            onClick={() => onChange(values.filter((other) => other !== value))}
            aria-label={`Remove ${value}`}
            className="rounded-full p-0.5 hover:bg-background"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        disabled={full}
        maxLength={maxLength}
        placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
        className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...aria}
      />
    </div>
  );
}
