import Link from "next/link";

// M1: brand + catalog link only. Role-aware navigation (SPEC §5) arrives with auth in M2.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/assets" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight">
            N5<span className="text-primary">Deal</span>
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">Fintech M&amp;A Marketplace</span>
        </Link>
        <nav className="text-sm font-medium">
          <Link href="/assets" className="hover:text-primary">
            All listings
          </Link>
        </nav>
      </div>
    </header>
  );
}
