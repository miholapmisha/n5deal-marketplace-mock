import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

import { CatalogLink } from "@/components/catalog/catalog-link";

type PageItem = number | "gap";

/** First, last, and the current page ±1, with gaps between: 1 … 4 5 6 … 12. */
export function pageItems(current: number, count: number): PageItem[] {
  const pages = [...new Set([1, current - 1, current, current + 1, count])]
    .filter((page) => page >= 1 && page <= count)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index): PageItem[] => {
    const previous = pages[index - 1];
    if (previous === undefined || page === previous + 1) return [page];
    // A gap of exactly one page shows that page instead of "…".
    return page === previous + 2 ? [previous + 1, page] : ["gap", page];
  });
}

interface CatalogPaginationProps {
  page: number;
  pageCount: number;
}

const itemClass = "flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 text-sm font-medium";

/** Page links scroll to the top: a new page is read from its first card. */
export function CatalogPagination({ page, pageCount }: CatalogPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <CatalogLink
          patch={{ page: page - 1 }}
          scroll
          className={cn(itemClass, "border border-border bg-card hover:border-primary")}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </CatalogLink>
      ) : null}
      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className={cn(itemClass, "px-1 text-muted-foreground")}>
            …
          </span>
        ) : (
          <CatalogLink
            key={item}
            patch={{ page: item }}
            scroll
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
          </CatalogLink>
        ),
      )}
      {page < pageCount ? (
        <CatalogLink
          patch={{ page: page + 1 }}
          scroll
          className={cn(itemClass, "border border-border bg-card hover:border-primary")}
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </CatalogLink>
      ) : null}
    </nav>
  );
}
