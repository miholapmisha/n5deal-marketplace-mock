"use client";

import { CheckCircle2, Loader2, Save } from "lucide-react";
import { type FormEvent, startTransition, useActionState, useRef, useState } from "react";

import { CompletenessMeter } from "@/components/buyer/completeness-meter";
import {
  AboutSection,
  MandateSection,
  type ProfileSectionProps,
  ThesisSection,
} from "@/components/buyer/profile-form-sections";
import { FormAlert } from "@/components/forms/form-alert";
import { useFormErrors } from "@/components/forms/use-form-errors";
import { Button } from "@/components/ui/button";
import {
  type BuyerProfileFormValues,
  type ProfileFormField,
  type ProfileFormState,
  profileCompleteness,
} from "@/lib/buyer-profile-form";
import type { CountryOption } from "@/lib/countries";
import { saveProfileAction } from "@/server/buyers/buyer.actions";

interface ProfileFormProps {
  initialValues: BuyerProfileFormValues;
  /** True until the first save: the form is the onboarding step and ends in the catalog. */
  onboarding: boolean;
  /** COUNTRY_OPTIONS from the server (labels must match between SSR and hydration). */
  countries: readonly CountryOption[];
}

const initialState: ProfileFormState = {};

/** S5. Controlled, so the completeness meter follows every edit and errors keep the input. */
export function ProfileForm({ initialValues, onboarding, countries }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [state, formAction, isPending] = useActionState(saveProfileAction, initialState);
  const { errorsFor, markEdited } = useFormErrors<ProfileFormField>(state, formRef);
  // "Saved" stays until the next edit, so it never describes values that changed since.
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  const [seenSave, setSeenSave] = useState(state.savedAt);
  if (state.savedAt !== seenSave) {
    setSeenSave(state.savedAt);
    setDirtySinceSave(false);
  }

  const update: ProfileSectionProps["update"] = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    markEdited(field);
    setDirtySinceSave(true);
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPending) startTransition(() => formAction(values));
  }

  const sectionProps: ProfileSectionProps = { values, errorsFor, update };
  const saved = state.savedAt !== undefined && !dirtySinceSave && !isPending;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {state.error && <FormAlert message={state.error} />}
        <AboutSection {...sectionProps} />
        <MandateSection {...sectionProps} countries={countries} />
        <ThesisSection {...sectionProps} />

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-card/95">
          <p role="status" className="flex items-center gap-1.5 text-sm text-success">
            {saved && (
              <>
                <CheckCircle2 className="size-4" aria-hidden />
                Profile saved
              </>
            )}
          </p>
          <Button type="submit" size="lg" disabled={isPending} aria-busy={isPending} className="h-10 rounded-full px-5">
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {isPending ? "Saving…" : onboarding ? "Save and browse assets" : "Save profile"}
          </Button>
        </div>
      </div>

      <aside className="order-first lg:sticky lg:top-20 lg:order-none">
        <CompletenessMeter percent={profileCompleteness(values)} />
      </aside>
    </form>
  );
}
