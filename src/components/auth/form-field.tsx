import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
  hint?: string;
};

export function FormField({ name, label, errors, hint, className, ...inputProps }: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasErrors = Boolean(errors?.length);
  const describedBy = [hint && hintId, hasErrors && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy}
        className={className ?? "h-10 bg-card"}
        {...inputProps}
      />
      {hint && !hasErrors && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {hasErrors && (
        <p id={errorId} className="text-xs text-destructive">
          {errors?.join(" ")}
        </p>
      )}
    </div>
  );
}
