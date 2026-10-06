"use client";

import { type ReactNode, useActionState, useId, useState } from "react";
import { cn } from "cn";

import { controlProps, Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ModerationFormState, REASON_MAX_LENGTH, REASON_MIN_LENGTH } from "@/lib/moderation";

type ModerationServerAction = (state: ModerationFormState, formData: FormData) => Promise<ModerationFormState>;

interface ModerationFormProps {
  action: ModerationServerAction;
  /** Hidden inputs: which record and which action. */
  fields: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  /** Removal only: the text the manager must type before the submit button enables. */
  confirmText?: string;
}

interface ModerationDialogProps extends ModerationFormProps {
  /** The button that opens the dialog. */
  trigger: ReactNode;
  title: string;
  description: ReactNode;
}

/**
 * SPEC §4.3: every moderation action asks for a reason in a modal. The form lives inside the
 * dialog content, which unmounts on close, so every opening starts with a fresh form.
 */
export function ModerationDialog({ trigger, title, description, ...formProps }: ModerationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ModerationForm {...formProps} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

const initialState: ModerationFormState = {};

function ModerationForm({
  action,
  fields,
  submitLabel,
  pendingLabel,
  destructive = false,
  confirmText,
  onDone,
}: ModerationFormProps & { onDone: () => void }) {
  const id = useId();
  // Controlled, so the typed text survives a failed submit (React resets uncontrolled forms).
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction] = useActionState(async (previous: ModerationFormState, formData: FormData) => {
    const next = await action(previous, formData);
    if (next.ok) onDone();
    return next;
  }, initialState);

  const reasonId = `${id}-reason`;
  const confirmationId = `${id}-confirmation`;
  const confirmed = confirmText === undefined || confirmation.trim() === confirmText;
  const hasFieldErrors = Boolean(state.fieldErrors?.reason || state.fieldErrors?.confirmation);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <Field
        id={reasonId}
        label="Reason"
        hint={`${REASON_MIN_LENGTH}–${REASON_MAX_LENGTH} characters. Saved in the moderation log; the account holder or asset owner sees it.`}
        errors={state.fieldErrors?.reason}
      >
        <Textarea
          name="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={REASON_MAX_LENGTH}
          rows={3}
          className="min-h-20"
          {...controlProps(reasonId, state.fieldErrors?.reason, true)}
        />
      </Field>

      {confirmText !== undefined && (
        <Field
          id={confirmationId}
          label={
            <span>
              Type <span className="font-semibold">{confirmText}</span> to confirm
            </span>
          }
          errors={state.fieldErrors?.confirmation}
        >
          <Input
            name="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="h-10"
            {...controlProps(confirmationId, state.fieldErrors?.confirmation)}
          />
        </Field>
      )}

      {state.error && !hasFieldErrors && <FormAlert message={state.error} />}

      <DialogFooter className="-mx-5 -mb-5 p-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-10 rounded-full px-5">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton
          disabled={!confirmed}
          pendingLabel={pendingLabel}
          className={cn("h-10 rounded-full px-5", destructive && "bg-destructive text-white hover:bg-destructive/90")}
        >
          {submitLabel}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
