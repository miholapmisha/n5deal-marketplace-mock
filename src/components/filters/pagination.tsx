import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "cn";

type PageItem = number | "gap";

export function pageItems(current: number, count: number): PageItem[] {
  const pages = [...new Set([1, current - 1, current, current + 1, count])]
    .filter((page) => page >= 1 && page <= count)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index): PageItem[] => {
    const previous = pages[index - 1];
    if (previous === undefined || page === previous + 1) return [page];
    return page === previous + 2 ? [previous + 1, page] : ["gap", page];
  });
}

export interface PageLinkProps {
  page: number;
  className: string;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page";
}

interface PaginationProps {
  page: number;
  pageCount: number;
  PageLink: ComponentType<PageLinkProps>;
}

const itemClass = "flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 text-sm font-medium";

export function Pagination({ page, pageCount, PageLink }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <PageLink page={page - 1} className={cn(itemClass, "border border-border bg-card hover:border-primary")}>
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </PageLink>
      ) : null}
      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className={cn(itemClass, "px-1 text-muted-foreground")}>
            …
          </span>
        ) : (
          <PageLink
            key={item}
            page={item}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              itemClass,
              item === page
                ? "bg-pill text-pill-foreground"
                : "border border-border bg-card hover:border-primary hover:text-primary",
            )}
          >
            {item}
          </PageLink>
        ),
      )}
      {page < pageCount ? (
        <PageLink page={page + 1} className={cn(itemClass, "border border-border bg-card hover:border-primary")}>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </PageLink>
      ) : null}
    </nav>
  );
}
