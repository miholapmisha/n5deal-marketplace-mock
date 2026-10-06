"use client";

import { Briefcase, type LucideIcon, ShieldCheck, Store } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoRole } from "@/lib/demo-accounts";
import { demoLoginAction } from "@/server/auth/auth.actions";
import type { DemoLoginFormState } from "@/server/auth/auth.schema";

interface DemoCard {
  role: DemoRole;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const CARDS: DemoCard[] = [
  { role: "buyer", title: "Enter as Buyer", description: "PE fund · complete profile · 2 conversations", Icon: Briefcase },
  { role: "seller", title: "Enter as Seller", description: "4 assets: 3 published, 1 draft", Icon: Store },
  { role: "manager", title: "Enter as Manager", description: "Moderate participants and listings", Icon: ShieldCheck },
];

const initialState: DemoLoginFormState = {};

function CardButton({ title, description, Icon, email }: Omit<DemoCard, "role"> & { email: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-semibold group-hover:text-primary">{pending ? "Entering…" : title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="mt-auto truncate font-mono text-xs text-muted-foreground">{email}</span>
    </button>
  );
}

/** SPEC §5 S1: one click per role, no typing. Each card is its own form (own pending state). */
export function DemoLoginCards({ next }: { next: string | null }) {
  const [state, formAction] = useActionState(demoLoginAction, initialState);

  return (
    <section aria-labelledby="demo-heading" className="flex flex-col gap-3">
      <h2 id="demo-heading" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Try the demo
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {CARDS.map(({ role, ...card }) => (
          <li key={role}>
            <form action={formAction} className="h-full">
              <input type="hidden" name="role" value={role} />
              {next && <input type="hidden" name="next" value={next} />}
              <CardButton {...card} email={DEMO_ACCOUNTS[role]} />
            </form>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Demo password for every seeded account:{" "}
        <code className="rounded-md bg-row px-1.5 py-0.5 font-mono whitespace-nowrap text-foreground">{DEMO_PASSWORD}</code>
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </section>
  );
}
