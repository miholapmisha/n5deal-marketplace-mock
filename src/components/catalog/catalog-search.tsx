"use client";

import { Sparkles } from "lucide-react";
import { type ComponentProps, useState, useTransition } from "react";
import { cn } from "cn";

import { useCatalogNavigation } from "@/components/catalog/catalog-navigation";
import { requestAiSearch } from "@/components/catalog/request-ai-search";
import { SearchBox } from "@/components/filters/search-box";
import { Switch } from "@/components/ui/switch";
import {
  type AiSearchResult,
  FALLBACK_NOTICES,
  MAX_AI_QUERY_LENGTH,
  type SearchFilters,
  searchFiltersOf,
} from "@/lib/ai-search";
import { catalogHref, DEFAULT_CATALOG_FILTERS } from "@/lib/catalog-filters";

/** What the last AI search did, shown while the filters it applied are still in place. */
interface Outcome {
  result: AiSearchResult;
  appliedKey: string;
}

/** Same filters → same key, whatever the sort or page. */
function filterKey(filters: SearchFilters): string {
  return catalogHref({ ...DEFAULT_CATALOG_FILTERS, ...filters });
}

/** Every filter is replaced: by the interpretation, or by the text as a keyword search. */
function filtersFor(result: AiSearchResult, query: string): SearchFilters {
  return result.mode === "ai" ? result.filters : { ...searchFiltersOf(DEFAULT_CATALOG_FILTERS), q: query };
}

/**
 * Keyword search over title, description, license, regulator, and country name — or, with
 * the switch on, AI search (SPEC §7): the sentence is turned into filters on the server and
 * the result lands in the URL like any other filter change.
 */
export function CatalogSearch() {
  const { filters, apply } = useCatalogNavigation();
  const [aiMode, setAiMode] = useState(false);
  // The sentence behind the current AI search. The box keeps showing it rather than the
  // keywords the model extracted into the URL.
  const [aiQuery, setAiQuery] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [isInterpreting, startInterpreting] = useTransition();

  function handleAiSearch(query: string | null) {
    setAiQuery(query);
    setOutcome(null);
    if (!query) return;

    startInterpreting(async () => {
      const result = await requestAiSearch(query);
      const next = filtersFor(result, query);
      setOutcome({ result, appliedKey: filterKey(next) });
      apply(next);
    });
  }

  function handleModeChange(enabled: boolean) {
    setAiMode(enabled);
    // Start from the keyword search, so switching on does not clear the box.
    setAiQuery(filters.q);
    setOutcome(null);
  }

  const box: ComponentProps<typeof SearchBox> = aiMode
    ? {
        query: aiQuery,
        onSearch: handleAiSearch,
        placeholder: "Describe it: active EMI in the EU under €3M",
        label: "Describe the asset you are looking for",
        maxLength: MAX_AI_QUERY_LENGTH,
      }
    : {
        query: filters.q,
        onSearch: (q) => apply({ q }),
        placeholder: "Search by license, country, regulator…",
        label: "Search assets",
      };

  // Once the filters change by hand (a chip, a tab), the notice no longer describes them.
  const shown = outcome?.appliedKey === filterKey(searchFiltersOf(filters)) ? outcome.result : null;

  return (
    <div className="flex flex-col gap-2">
      {isInterpreting && <span hidden data-pending="" />}
      {/* One element for both modes, so text typed before flipping the switch stays. */}
      <SearchBox {...box} pending={isInterpreting} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
          <Switch checked={aiMode} onCheckedChange={handleModeChange} />
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI search
        </label>
        <p role="status" className={cn("text-sm", shown?.mode === "keyword" ? "text-warning" : "text-muted-foreground")}>
          {isInterpreting
            ? "Reading your search…"
            : shown &&
              (shown.mode === "ai" ? "Filters set by AI search — remove a chip to adjust." : FALLBACK_NOTICES[shown.reason])}
        </p>
      </div>
    </div>
  );
}
