"use client";

import { type FocusEvent, type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { parsePriceInput } from "@/lib/catalog-filters";

function euroText(value: number | null): string {
  return value === null ? "" : String(value);
}

interface EuroRangeProps {
  legend: string;
  noun: string;
  min: number | null;
  max: number | null;
  hint: string;
  submitLabel: string;
  onApply: (min: number | null, max: number | null) => void;
}

export function EuroRange({ legend, noun, min, max, hint, submitLabel, onApply }: EuroRangeProps) {
  const id = useId();
  const [low, setLow] = useState(euroText(min));
  const [high, setHigh] = useState(euroText(max));
  const [error, setError] = useState<string | null>(null);
  const urlRange = `${min}:${max}`;
  const [syncedRange, setSyncedRange] = useState(urlRange);
  if (urlRange !== syncedRange) {
    setSyncedRange(urlRange);
    setLow(euroText(min));
    setHigh(euroText(max));
    setError(null);
  }

  function commit() {
    const lowValue = low.trim() ? parsePriceInput(low) : null;
    const highValue = high.trim() ? parsePriceInput(high) : null;
    if ((low.trim() && lowValue === null) || (high.trim() && highValue === null)) {
      setError("Enter whole euros, e.g. 500000.");
      return;
    }
    setError(null);
    const reversed = lowValue !== null && highValue !== null && lowValue > highValue;
    const nextMin = (reversed ? highValue : lowValue) || null;
    const nextMax = reversed ? lowValue : highValue;
    if (nextMin !== min || nextMax !== max) onApply(nextMin, nextMax);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commit();
  }

  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) commit();
  }

  const inputClass =
    "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";
  const errorProps = {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;

  return (
    <section aria-labelledby={`${id}-legend`} className="flex flex-col gap-2.5 border-t border-border pt-4">
      <h3 id={`${id}-legend`} className="text-sm font-semibold">
        {legend}
      </h3>
      <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={low}
            onChange={(event) => setLow(event.target.value)}
            placeholder="Min"
            aria-label={`Minimum ${noun} in euros`}
            {...errorProps}
            className={inputClass}
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <input
            inputMode="numeric"
            value={high}
            onChange={(event) => setHigh(event.target.value)}
            placeholder="Max"
            aria-label={`Maximum ${noun} in euros`}
            {...errorProps}
            className={inputClass}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{hint}</p>
        <Button type="submit" variant="secondary" className="h-9 rounded-full">
          {submitLabel}
        </Button>
      </form>
    </section>
  );
}
