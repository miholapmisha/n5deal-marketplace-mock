const CARD_PLACEHOLDERS = 6;
const TAB_PLACEHOLDERS = 6;

export default function CatalogLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading listings">
      <div className="flex flex-col gap-4">
        <div className="h-9 w-48 rounded-lg bg-muted" />
        <div className="h-5 w-full max-w-lg rounded bg-muted" />
        <div className="h-10 w-full rounded-full bg-card" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: TAB_PLACEHOLDERS }, (_, index) => (
          <div key={index} className="h-10 w-24 shrink-0 rounded-full bg-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden h-[32rem] rounded-2xl bg-card lg:block" />
        <div className="flex flex-col gap-4">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: CARD_PLACEHOLDERS }, (_, index) => (
              <div key={index} className="flex h-[30rem] flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="h-6 w-1/2 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
                <div className="h-8 rounded-lg bg-muted" />
                {Array.from({ length: 5 }, (_, row) => (
                  <div key={row} className="h-8 rounded-lg bg-muted/70" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
