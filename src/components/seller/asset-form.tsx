"use client";

import { Eye, Loader2, Save, Send } from "lucide-react";
import { type FormEvent, type ReactNode, startTransition, useActionState, useRef, useState } from "react";

import { AssetCard } from "@/components/asset-card";
import { FormAlert } from "@/components/forms/form-alert";
import { useFormErrors } from "@/components/forms/use-form-errors";
import { BasicsSection, DetailsSection, PriceSection, type SectionProps } from "@/components/seller/asset-form-sections";
import { Button } from "@/components/ui/button";
import type { AssetStatus } from "@/generated/prisma/enums";
import type { CountryOption } from "@/lib/countries";
import {
  ASSET_INTENTS,
  type AssetFormField,
  type AssetFormState,
  type AssetFormValues,
  type AssetIntent,
  previewAsset,
} from "@/lib/asset-form";
import { saveAssetAction } from "@/server/assets/asset.actions";

interface SubmitOption {
  intent: AssetIntent;
  label: string;
  pendingLabel: string;
  icon: ReactNode;
  primary: boolean;
}

/**
 * The buttons depend on where the asset stands. A hidden asset only gets "Save changes":
 * the service keeps it HIDDEN whatever the intent, since only a manager can unhide it.
 */
function submitOptions(status: AssetStatus | null): SubmitOption[] {
  const save = <Save aria-hidden />;
  const publish = <Send aria-hidden />;
  switch (status) {
    case "HIDDEN":
      return [{ intent: "draft", label: "Save changes", pendingLabel: "Saving…", icon: save, primary: true }];
    case "PUBLISHED":
      return [
        { intent: "draft", label: "Move to drafts", pendingLabel: "Saving…", icon: save, primary: false },
        { intent: "publish", label: "Save changes", pendingLabel: "Saving…", icon: publish, primary: true },
      ];
    default:
      return [
        { intent: "draft", label: "Save draft", pendingLabel: "Saving…", icon: save, primary: false },
        { intent: "publish", label: "Publish", pendingLabel: "Publishing…", icon: publish, primary: true },
      ];
  }
}

function isIntent(value: string | null | undefined): value is AssetIntent {
  return ASSET_INTENTS.some((intent) => intent === value);
}

interface AssetFormProps {
  /** Absent for a new asset. */
  assetId?: string;
  /** Null for a new asset. */
  status: AssetStatus | null;
  initialValues: AssetFormValues;
  /** COUNTRY_OPTIONS from the server (labels must match between SSR and hydration). */
  countries: readonly CountryOption[];
}

const initialState: AssetFormState = {};

/**
 * S7. Controlled, so the live preview (the real catalog card) follows every keystroke and
 * nothing typed is lost on a validation error. Submitted as an object, not FormData: the
 * server action re-parses it with Zod either way.
 */
export function AssetForm({ assetId, status, initialValues, countries }: AssetFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initialValues);
  const [state, formAction, isPending] = useActionState(saveAssetAction, initialState);
  const [pendingIntent, setPendingIntent] = useState<AssetIntent | null>(null);
  const { errorsFor, markEdited } = useFormErrors<AssetFormField>(state, formRef);

  const update: SectionProps["update"] = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    markEdited(field);
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    // Enter in a text field submits with the first button: the safe "draft" one.
    const submitter = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    const intent = isIntent(submitter) ? submitter : "draft";
    setPendingIntent(intent);
    startTransition(() => formAction({ assetId, intent, values }));
  }

  const sectionProps: SectionProps = { values, errorsFor, update };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {state.error && <FormAlert message={state.error} />}
        <BasicsSection {...sectionProps} countries={countries} />
        <PriceSection {...sectionProps} />
        <DetailsSection {...sectionProps} />

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-card/95">
          {submitOptions(status).map((option) => (
            <Button
              key={option.intent}
              type="submit"
              value={option.intent}
              variant={option.primary ? "default" : "outline"}
              size="lg"
              disabled={isPending}
              aria-busy={isPending && pendingIntent === option.intent}
              className="h-10 rounded-full px-5"
            >
              {isPending && pendingIntent === option.intent ? <Loader2 className="animate-spin" aria-hidden /> : option.icon}
              {isPending && pendingIntent === option.intent ? option.pendingLabel : option.label}
            </Button>
          ))}
        </div>
      </div>

      <aside aria-label="Live preview" className="flex flex-col gap-3 lg:sticky lg:top-20">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Eye className="size-4" aria-hidden />
          Live preview — how buyers see the card
        </p>
        <AssetCard
          asset={previewAsset(values)}
          countryLabel={countries.find((option) => option.value === values.country)?.label ?? "Your country"}
          preview
        />
      </aside>
    </form>
  );
}
