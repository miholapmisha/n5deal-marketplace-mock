"use client";

import { type RefObject, useEffect, useState } from "react";

interface FieldErrorState<F extends string> {
  error?: string;
  fieldErrors?: Partial<Record<F, string[]>>;
}

/**
 * Server-side Zod errors for a controlled form: a field's error disappears as soon as the
 * person edits it, and after each submit focus moves to the first invalid control (or the
 * form-level alert), so keyboard and screen-reader users land on the problem.
 */
export function useFormErrors<F extends string>(state: FieldErrorState<F>, formRef: RefObject<HTMLFormElement | null>) {
  const [seenState, setSeenState] = useState(state);
  const [edited, setEdited] = useState<ReadonlySet<F>>(new Set());
  if (state !== seenState) {
    setSeenState(state);
    setEdited(new Set());
  }

  useEffect(() => {
    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>(':is(input, select, textarea)[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>("[data-form-alert]");
    target?.focus();
  }, [state, formRef]);

  return {
    errorsFor: (field: F): string[] | undefined => (edited.has(field) ? undefined : state.fieldErrors?.[field]),
    markEdited: (field: F) => setEdited((previous) => (previous.has(field) ? previous : new Set([...previous, field]))),
  };
}
