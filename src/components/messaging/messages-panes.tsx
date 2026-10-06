"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "cn";

interface MessagesPanesProps {
  list: ReactNode;
  children: ReactNode;
}

export function MessagesPanes({ list, children }: MessagesPanesProps) {
  const threadOpen = useSelectedLayoutSegment() !== null;

  return (
    <div className="grid h-[calc(100dvh-11rem)] min-h-[26rem] overflow-hidden rounded-2xl border border-border bg-card shadow-card md:h-[calc(100dvh-8rem)] md:grid-cols-[20rem_minmax(0,1fr)] lg:grid-cols-[23rem_minmax(0,1fr)]">
      <div className={cn("min-h-0 flex-col md:flex md:border-r md:border-border", threadOpen ? "hidden" : "flex")}>
        {list}
      </div>
      <div className={cn("min-h-0 min-w-0 flex-col md:flex", threadOpen ? "flex" : "hidden")}>{children}</div>
    </div>
  );
}
