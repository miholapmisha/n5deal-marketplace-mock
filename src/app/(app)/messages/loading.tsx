// Right-pane skeleton while a thread loads; the conversation list (layout) stays in place.
export default function ThreadLoading() {
  return (
    <div className="flex flex-1 animate-pulse flex-col" aria-busy aria-label="Loading conversation">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
        <div className="h-12 rounded-xl bg-muted" />
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        <div className="h-12 w-2/3 rounded-2xl bg-muted" />
        <div className="h-16 w-1/2 self-end rounded-2xl bg-muted" />
        <div className="h-10 w-3/5 rounded-2xl bg-muted" />
      </div>
      <div className="border-t border-border p-4">
        <div className="h-11 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
