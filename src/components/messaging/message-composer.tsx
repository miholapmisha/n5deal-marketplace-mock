"use client";

import { Loader2, SendHorizontal } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useId, useState, useTransition } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX_LENGTH } from "@/lib/messaging";

const COUNTER_FROM = MESSAGE_MAX_LENGTH - 300;

interface MessageComposerProps {
  label: string;
  defaultBody?: string;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  roomy?: boolean;
  clearOnSend?: boolean;
  onSend: (body: string) => Promise<string | null>;
}

export function MessageComposer({
  label,
  defaultBody = "",
  placeholder = "Write a message…",
  submitLabel = "Send",
  disabled = false,
  roomy = false,
  clearOnSend = false,
  onSend,
}: MessageComposerProps) {
  const id = useId();
  const [body, setBody] = useState(defaultBody);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const trimmed = body.trim();
  const canSend = !disabled && !isPending && trimmed.length > 0;

  function send() {
    if (!canSend) return;
    setError(null);
    if (clearOnSend) setBody("");
    startTransition(async () => {
      const failure = await onSend(trimmed);
      if (failure === null) {
        setBody("");
        return;
      }
      setError(failure);
      if (clearOnSend) setBody((current) => (current.trim() === "" ? trimmed : current));
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className={cn("flex gap-2", roomy ? "flex-col" : "items-end")}>
        <Textarea
          id={id}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={MESSAGE_MAX_LENGTH}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("resize-none bg-card", roomy ? "min-h-32 max-h-72" : "max-h-48 min-h-11")}
        />
        <Button
          type="submit"
          disabled={!canSend}
          aria-busy={isPending}
          aria-label={roomy ? undefined : submitLabel}
          className={cn("h-11 rounded-full px-4", roomy && "w-full")}
        >
          {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <SendHorizontal aria-hidden />}
          <span className={cn(!roomy && "hidden sm:inline")}>{isPending ? "Sending…" : submitLabel}</span>
        </Button>
      </div>
      <div className="flex min-h-4 items-start justify-between gap-3 text-xs text-muted-foreground">
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <span className="hidden sm:inline">{disabled ? "" : "Ctrl + Enter (⌘ + Enter on Mac) to send"}</span>
        )}
        {body.length >= COUNTER_FROM && (
          <span className="ml-auto shrink-0 tabular-nums">
            {body.length} / {MESSAGE_MAX_LENGTH}
          </span>
        )}
      </div>
    </form>
  );
}
