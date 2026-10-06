import { LogOut, Plus } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/labels";
import { logoutAction } from "@/server/auth/auth.actions";
import { getCurrentUser } from "@/server/auth/session";

interface NavLink {
  href: string;
  label: string;
}

// SPEC §5 "Global header by role". Unread counts on Messages arrive with messaging (M5).
const NAV_BY_ROLE: Record<Role | "ANONYMOUS", NavLink[]> = {
  ANONYMOUS: [{ href: "/assets", label: "All listings" }],
  BUYER: [
    { href: "/assets", label: "Assets" },
    { href: "/messages", label: "Messages" },
    { href: "/profile", label: "My profile" },
  ],
  SELLER: [
    { href: "/buyers", label: "Buyers" },
    { href: "/seller/assets", label: "My assets" },
    { href: "/messages", label: "Messages" },
  ],
  MANAGER: [
    { href: "/manager", label: "Overview" },
    { href: "/manager/users", label: "Participants" },
  ],
};

export async function SiteHeader() {
  const user = await getCurrentUser();
  const links = NAV_BY_ROLE[user?.role ?? "ANONYMOUS"];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-1 px-4 py-3 md:h-16 md:py-0">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight">
            N5<span className="text-primary">Deal</span>
          </span>
          <span className="hidden text-xs text-muted-foreground lg:inline">Fintech M&amp;A Marketplace</span>
        </Link>

        <nav
          aria-label="Main"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-5 overflow-x-auto px-4 pb-2 text-sm font-medium whitespace-nowrap md:order-none md:mx-0 md:w-auto md:p-0"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="py-1 hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user?.role === "SELLER" && (
            <Button asChild size="lg">
              <Link href="/seller/assets/new" aria-label="Publish asset">
                <Plus aria-hidden />
                <span className="hidden sm:inline">Publish asset</span>
              </Link>
            </Button>
          )}
          {user ? (
            <>
              <span className="hidden flex-col items-end leading-tight sm:flex">
                <span className="max-w-40 truncate text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
              </span>
              <form action={logoutAction}>
                <SubmitButton variant="ghost" size="lg" aria-label="Log out">
                  <LogOut aria-hidden />
                  <span className="hidden sm:inline">Log out</span>
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="lg">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/register">Start now</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
