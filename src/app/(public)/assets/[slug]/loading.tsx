export default function AssetDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading asset">
      <div className="h-5 w-28 rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <div className="h-44 rounded-2xl bg-card" />
          <div className="h-48 rounded-2xl bg-card" />
          <div className="h-56 rounded-2xl bg-card" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-28 rounded-2xl bg-card" />
          <div className="h-40 rounded-2xl bg-card" />
        </div>
      </div>
    </div>
  );
}
