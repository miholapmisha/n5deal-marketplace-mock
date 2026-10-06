import { cn } from "cn";

const COMPLETE = 100;

/** S5 "profile completeness meter": the share of filled fields, as a bar. */
export function CompletenessMeter({ percent }: { percent: number }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="completeness-label" className="font-semibold">
          Profile completeness
        </h2>
        <span className={cn("text-2xl font-bold", percent === COMPLETE ? "text-success" : "text-primary")}>
          {percent}%
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby="completeness-label"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={COMPLETE}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", percent === COMPLETE ? "bg-success" : "bg-primary")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {percent === COMPLETE
          ? "Complete. Sellers see your full mandate."
          : "A complete profile ranks assets more precisely and gets more replies from sellers."}
      </p>
    </section>
  );
}
