import type { ReactNode } from "react";
import { cn } from "cn";

import { Label } from "@/components/ui/label";

export function controlProps(id: string, errors?: string[], hasHint = false) {
  const hasErrors = Boolean(errors?.length);
  const describedBy = [hasHint && !hasErrors && `${id}-hint`, hasErrors && `${id}-error`].filter(Boolean).join(" ");
  return { id, "aria-invalid": hasErrors || undefined, "aria-describedby": describedBy || undefined };
}

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  errors?: string[];
  group?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, errors, group = false, className, children }: FieldProps) {
  const hasErrors = Boolean(errors?.length);
  const footer = (
    <>
      {hint && !hasErrors && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {hasErrors && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {errors?.join(" ")}
        </p>
      )}
    </>
  );

  if (group) {
    return (
      <fieldset
        id={id}
        aria-invalid={hasErrors || undefined}
        aria-describedby={controlProps(id, errors, Boolean(hint))["aria-describedby"]}
        className={cn("flex min-w-0 flex-col gap-1.5", className)}
      >
        <legend className="mb-1.5 text-sm font-medium">{label}</legend>
        {children}
        {footer}
      </fieldset>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {footer}
    </div>
  );
}

export const selectClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}
