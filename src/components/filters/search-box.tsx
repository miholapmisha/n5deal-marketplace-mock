"use client";

import { Search, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

const MAX_QUERY_LENGTH = 100;

interface SearchBoxProps {
  /** The search in the URL. */
  query: string | null;
  /** Called with the cleaned-up text, or null to clear the search. */
  onSearch: (query: string | null) => void;
  placeholder: string;
  label: string;
}

/** A keyword search whose value lives in the URL; it applies on submit, not per keystroke. */
export function SearchBox({ query, onSearch, placeholder, label }: SearchBoxProps) {
  const [text, setText] = useState(query ?? "");
  // Follow the URL when it changes elsewhere (a removed chip, "Reset all filters").
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setText(query ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = text.replace(/\s+/g, " ").trim();
    onSearch(cleaned || null);
  }

  function handleClear() {
    setText("");
    if (query) onSearch(null);
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
          placeholder={placeholder}
          aria-label={label}
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
