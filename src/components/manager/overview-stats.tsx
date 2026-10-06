import { Building2, EyeOff, type LucideIcon, PackageCheck, UserRoundSearch, UserX } from "lucide-react";
import Link from "next/link";

import {
  DEFAULT_MANAGER_ASSET_FILTERS,
  DEFAULT_PARTICIPANT_FILTERS,
  managerAssetsHref,
  participantsHref,
} from "@/lib/manager-filters";
import type { OverviewStats as Stats } from "@/server/moderation/moderation.service";

interface StatCard {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  /** The list behind the number. */
  href: string;
}

function cardsFor(stats: Stats): StatCard[] {
  return [
    {
      label: "Buyers",
      value: stats.buyers,
      hint: "Accounts not removed",
      icon: UserRoundSearch,
      href: participantsHref({ ...DEFAULT_PARTICIPANT_FILTERS, role: "BUYER" }),
    },
    {
      label: "Sellers",
      value: stats.sellers,
      hint: "Accounts not removed",
      icon: Building2,
      href: participantsHref({ ...DEFAULT_PARTICIPANT_FILTERS, role: "SELLER" }),
    },
    {
      label: "Published assets",
      value: stats.liveAssets,
      hint: "Live in the public catalog",
      icon: PackageCheck,
      href: managerAssetsHref({ ...DEFAULT_MANAGER_ASSET_FILTERS, status: "PUBLISHED" }),
    },
    {
      label: "Hidden assets",
      value: stats.hiddenAssets,
      hint: "Hidden by a manager",
      icon: EyeOff,
      href: managerAssetsHref({ ...DEFAULT_MANAGER_ASSET_FILTERS, status: "HIDDEN" }),
    },
    {
      label: "Suspended users",
      value: stats.suspendedUsers,
      hint: "Buyers and sellers",
      icon: UserX,
      href: participantsHref({ ...DEFAULT_PARTICIPANT_FILTERS, status: "SUSPENDED" }),
    },
  ];
}

/** S10 stat cards. Each one links to the list it counts. */
export function OverviewStats({ stats }: { stats: Stats }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cardsFor(stats).map(({ label, value, hint, icon: Icon, href }) => (
        <li key={label} className="flex">
          <Link
            href={href}
            className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary"
          >
            <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              {label}
              <Icon className="size-4 text-primary" aria-hidden />
            </span>
            <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
