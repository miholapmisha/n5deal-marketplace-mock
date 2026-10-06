"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "cn";

import { conversationPath } from "@/lib/messaging";

export function ConversationLink({ id, children }: { id: string; children: ReactNode }) {
  const isOpen = useSelectedLayoutSegment() === id;

  return (
    <Link
      href={conversationPath(id)}
      aria-current={isOpen ? "page" : undefined}
      className={cn(
        "flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
        isOpen && "bg-secondary hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}
