"use client";

import { Search, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { Button } from "@/components/ui/button";

const MAX_QUERY_LENGTH = 100;

/** Keyword search over title, description, license, regulator, and country name. */
export function CatalogSearch() {
  const { filters, apply } = useCatalogNavigation();
  const [text, setText] = useState(filters.q ?? "");
  // Follow the URL when it changes elsewhere (a removed chip, "Reset all filters").
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    setText(filters.q ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = text.replace(/\s+/g, " ").trim();
    apply({ q: q || null });
  }

  function handleClear() {
    setText("");
    if (filters.q) apply({ q: null });
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-1 gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="Search by license, country, regulator…"
          aria-label="Search assets"
          className="h-10 w-full rounded-full border border-input bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <Button type="submit" className="h-10 rounded-full px-5">
        Search
      </Button>
    </form>
  );
}
