import { cn } from "cn";

import { initials } from "@/lib/messaging";

/** Initials in a circle: there are no profile pictures (no uploads, SPEC §1.8). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
