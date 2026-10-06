import { ArrowLeft, ExternalLink, UserRound } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/messaging/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryFlag, countryName, formatPrice } from "@/lib/format";
import { MESSAGES_PATH } from "@/lib/messaging";
import type { ConversationView } from "@/server/messaging/message.service";

interface ThreadHeaderProps {
  title: string;
  subtitle: string;
  /** S9 link, for a seller looking at a buyer. */
  profileHref?: string | null;
  asset: ConversationView["asset"];
}

/** Counterpart on top, then the asset the conversation is about (SPEC §5 S2). */
export function ThreadHeader({ title, subtitle, profileHref, asset }: ThreadHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="-ml-2 shrink-0 rounded-full md:hidden">
          <Link href={MESSAGES_PATH} aria-label="All conversations">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <Avatar name={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate font-semibold">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {profileHref && (
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
            <Link href={profileHref}>
              <UserRound aria-hidden />
              <span className="hidden sm:inline">View profile</span>
              <span className="sr-only sm:hidden">View buyer profile</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-row-border/70 bg-row px-3 py-2">
        <span aria-hidden className="text-xl leading-none">
          {countryFlag(asset.country)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold">{asset.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{countryName(asset.country)}</span>
            <span aria-hidden>·</span>
            <span className="font-semibold text-primary">{formatPrice(asset.priceEur)}</span>
            {asset.notice && (
              <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                {asset.notice}
              </Badge>
            )}
          </p>
        </div>
        {asset.href && (
          <Link
            href={asset.href}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <span className="hidden sm:inline">View asset</span>
            <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only sm:hidden">View asset</span>
          </Link>
        )}
      </div>
    </header>
  );
}
