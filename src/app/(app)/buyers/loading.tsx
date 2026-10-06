const CARD_PLACEHOLDERS = 6;

/** S8 skeleton: shown on first entry to the directory (filter changes keep the old results). */
export default function BuyersLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading buyers">
      <div className="flex flex-col gap-4">
        <div className="h-9 w-40 rounded-lg bg-muted" />
        <div className="h-5 w-full max-w-lg rounded bg-muted" />
        <div className="h-10 w-full rounded-full bg-card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden h-[32rem] rounded-2xl bg-card lg:block" />
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-3">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-10 w-56 rounded-full bg-card" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: CARD_PLACEHOLDERS }, (_, index) => (
              <div key={index} className="flex h-[22rem] flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted" />
                  <div className="h-5 flex-1 rounded bg-muted" />
                </div>
                {Array.from({ length: 3 }, (_, row) => (
                  <div key={row} className="h-8 rounded-lg bg-muted/70" />
                ))}
                <div className="h-6 w-2/3 rounded bg-muted" />
                <div className="h-14 rounded bg-muted/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
