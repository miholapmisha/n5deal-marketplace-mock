export default function BuyerDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading buyer">
      <div className="h-5 w-28 rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex h-28 items-center gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="size-14 rounded-full bg-muted" />
            <div className="h-8 flex-1 rounded bg-muted" />
          </div>
          <div className="h-64 rounded-2xl border border-border bg-card" />
          <div className="h-40 rounded-2xl border border-border bg-card" />
        </div>
        <div className="h-96 rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
