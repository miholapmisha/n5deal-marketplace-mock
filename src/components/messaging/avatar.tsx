import { cn } from "cn";

import { initials } from "@/lib/messaging";

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
