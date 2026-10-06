"use client";

import { Loader2, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FilterSheetProps {
  activeCount: number;
  isPending: boolean;
  total: number;
  children: ReactNode;
}

export function FilterSheet({ activeCount, isPending, total, children }: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 rounded-full bg-card px-4 lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          <SheetDescription>Changes apply as you make them.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <SheetFooter className="border-t border-border">
          <SheetClose asChild>
            <Button className="h-10 w-full rounded-full" aria-busy={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Updating…
                </>
              ) : (
                `Show ${total} ${total === 1 ? "result" : "results"}`
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
