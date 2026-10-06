import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { MatchBadge } from "@/components/match-badge";
import { Avatar } from "@/components/messaging/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buyerDetailPath } from "@/lib/buyer-filters";
import { countryFlag, countryName, formatTicketRange } from "@/lib/format";
import { BUYER_TYPE_LABELS, CATEGORY_LABELS, TIMELINE_LABELS } from "@/lib/labels";
import type { BuyerCardData } from "@/server/buyers/buyer.service";

const MAX_COUNTRIES = 3;

function countriesLabel(codes: string[]): string {
  if (codes.length === 0) return "Any country";
  const names = codes.slice(0, MAX_COUNTRIES).map(countryName).join(", ");
  return codes.length > MAX_COUNTRIES ? `${names} +${codes.length - MAX_COUNTRIES}` : names;
}

interface BuyerCardProps {
  buyer: BuyerCardData;
  canContact: boolean;
  rankAssetId: string | null;
}

export function BuyerCard({ buyer, canContact, rankAssetId }: BuyerCardProps) {
  const { profile } = buyer;
  const title = buyer.companyName ?? buyer.name;
  const detailPath = buyerDetailPath(buyer.id, rankAssetId);
  const rows = [
    { label: "Timeline", value: TIMELINE_LABELS[profile.timeline] },
    { label: "Countries", value: countriesLabel(profile.countries), flags: profile.countries.slice(0, MAX_COUNTRIES) },
  ];

  return (
    <article className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <header className="flex items-center gap-3">
        <Avatar name={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="line-clamp-2 leading-snug font-semibold">
            <Link href={detailPath} className="hover:text-primary">
              {title}
            </Link>
          </h3>
          {buyer.companyName && <p className="truncate text-sm text-muted-foreground">{buyer.name}</p>}
        </div>
      </header>

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="border-row-border">
          {BUYER_TYPE_LABELS[profile.buyerType]}
        </Badge>
        {buyer.match !== null && <MatchBadge score={buyer.match} />}
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-row-border bg-row px-3 py-2">
          <dt className="text-primary">Ticket size</dt>
          <dd className="font-semibold text-primary">
            {formatTicketRange(profile.ticketMinEur, profile.ticketMaxEur)}
          </dd>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-row-border/60 px-3 py-1.5"
          >
            <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 font-semibold">
              {row.flags?.map((code) => (
                <span key={code} aria-hidden className="shrink-0">
                  {countryFlag(code)}
                </span>
              ))}
              <span className="truncate">{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-wrap gap-1.5" aria-label="Target categories">
        {profile.categories.length === 0 ? (
          <li>
            <Badge variant="outline" className="border-row-border font-normal">
              Any category
            </Badge>
          </li>
        ) : (
          profile.categories.map((category) => (
            <li key={category}>
              <Badge variant="secondary">{CATEGORY_LABELS[category]}</Badge>
            </li>
          ))
        )}
      </ul>

      <p className="line-clamp-3 text-sm text-muted-foreground">{profile.thesis}</p>

      <div className="mt-auto flex gap-2 pt-1">
        <Button asChild variant="outline" className="flex-1 rounded-full">
          <Link href={detailPath}>View</Link>
        </Button>
        {canContact && (
          <Button asChild className="flex-1 rounded-full">
            <Link href={`${detailPath}#contact`}>
              <MessageSquare aria-hidden />
              Contact
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
