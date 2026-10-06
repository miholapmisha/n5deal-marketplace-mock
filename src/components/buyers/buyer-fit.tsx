import Link from "next/link";
import { cn } from "cn";

import { MatchBadge } from "@/components/match-badge";
import { MATCH_SIGNAL_MAX, type MatchSignal } from "@/server/matching/match-score";
import type { ContactAssetOption } from "@/server/messaging/message.service";

const SIGNAL_LABELS: Record<MatchSignal, string> = {
  category: "Category",
  country: "Country",
  price: "Ticket size",
  status: "Business status",
};

const SIGNALS = Object.keys(SIGNAL_LABELS) as MatchSignal[];

function signalTone(points: number, max: number): string {
  if (points === max) return "border-success/30 bg-success/10 text-success";
  if (points > 0) return "border-primary/25 bg-secondary text-primary";
  return "border-row-border text-muted-foreground";
}

interface BuyerFitProps {
  /** The seller's published assets scored against this buyer, best first. */
  assets: ContactAssetOption[];
  /** The asset the seller came from (ranked directory), marked in the list. */
  highlightId: string | null;
}

/** S9 for sellers: the match score per own asset, split into its signals (SPEC §4.4). */
export function BuyerFit({ assets, highlightId }: BuyerFitProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Fit with your assets</h2>
        <p className="text-sm text-muted-foreground">
          How well this buyer&apos;s criteria match each of your published assets.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className={cn(
              "flex flex-col gap-2.5 rounded-xl border p-3",
              asset.id === highlightId ? "border-primary/40 bg-secondary/50" : "border-row-border/60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <Link href={`/assets/${asset.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                {asset.title}
              </Link>
              <MatchBadge score={asset.match} />
            </div>
            <dl className="flex flex-wrap gap-1.5 text-xs">
              {SIGNALS.map((signal) => (
                <div
                  key={signal}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5",
                    signalTone(asset.signals[signal], MATCH_SIGNAL_MAX[signal]),
                  )}
                >
                  <dt>{SIGNAL_LABELS[signal]}</dt>
                  <dd className="font-semibold tabular-nums">
                    {asset.signals[signal]}/{MATCH_SIGNAL_MAX[signal]}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
