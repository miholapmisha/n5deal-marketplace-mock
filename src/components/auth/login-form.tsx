"use client";

import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/submit-button";
import { loginAction } from "@/server/auth/auth.actions";
import type { LoginFormState } from "@/server/auth/auth.schema";

const initialState: LoginFormState = { email: "" };

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
        errors={state.fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" className="h-10 w-full" pendingLabel="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
