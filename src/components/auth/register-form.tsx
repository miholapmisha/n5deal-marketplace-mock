"use client";

import { Briefcase, type LucideIcon, Store } from "lucide-react";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/submit-button";
import { registerAction } from "@/server/auth/auth.actions";
import type { RegisterFormState } from "@/server/auth/auth.schema";

const ROLE_OPTIONS: { value: "BUYER" | "SELLER"; title: string; description: string; Icon: LucideIcon }[] = [
  { value: "BUYER", title: "I want to buy", description: "Find licensed businesses that match your mandate", Icon: Briefcase },
  { value: "SELLER", title: "I want to sell", description: "List a license or business and reach buyers", Icon: Store },
];

const initialState: RegisterFormState = {
  values: { role: "BUYER", name: "", companyName: "", email: "" },
};

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const { values, fieldErrors } = state;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2" aria-describedby={fieldErrors?.role ? "role-error" : undefined}>
        <legend className="mb-1.5 text-sm font-medium">Account type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map(({ value, title, description, Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-xl border border-input bg-card p-4 transition has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="role"
                value={value}
                defaultChecked={values.role === value}
                className="sr-only"
              />
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </span>
            </label>
          ))}
        </div>
        {fieldErrors?.role && (
          <p id="role-error" className="text-xs text-destructive">
            {fieldErrors.role.join(" ")}
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="name"
          label="Full name"
          autoComplete="name"
          required
          defaultValue={values.name}
          errors={fieldErrors?.name}
        />
        <FormField
          name="companyName"
          label="Company (optional)"
          autoComplete="organization"
          defaultValue={values.companyName}
          errors={fieldErrors?.companyName}
        />
      </div>
      <FormField
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        required
        defaultValue={values.email}
        errors={fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        errors={fieldErrors?.password}
      />
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" className="h-10 w-full" pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
