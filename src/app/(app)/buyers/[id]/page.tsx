import { ArrowLeft, CalendarDays, PackagePlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BuyerFit } from "@/components/buyers/buyer-fit";
import { Avatar } from "@/components/messaging/avatar";
import { ContactBuyerForm } from "@/components/messaging/contact-buyer-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buyersHref, DEFAULT_BUYER_FILTERS } from "@/lib/buyer-filters";
import { countryFlag, countryName, formatDate, formatTicketRange } from "@/lib/format";
import { BUYER_TYPE_LABELS, CATEGORY_LABELS, STATUS_PREF_LABELS, TIMELINE_LABELS } from "@/lib/labels";
import { conversationPath } from "@/lib/messaging";
import { parseAssetParam } from "@/lib/parse-buyer-filters";
import { requireRole } from "@/server/auth/guards";
import { type BuyerDetail, getBuyerDetail } from "@/server/buyers/buyer.service";
import { type ContactBuyerOptions, getContactBuyerOptions } from "@/server/messaging/message.service";

export async function generateMetadata({ params }: PageProps<"/buyers/[id]">): Promise<Metadata> {
  const buyer = await getBuyerDetail((await params).id);
  return { title: buyer ? (buyer.companyName ?? buyer.name) : "Buyer not found" };
}

// S9. Private (sellers and managers only); a buyer who is suspended, removed, or hidden from
// sellers is a 404. Sellers see how the buyer fits each of their published assets and contact
// them about one; `?asset=` (from the ranked directory) preselects it.
export default async function BuyerDetailPage({ params, searchParams }: PageProps<"/buyers/[id]">) {
  const viewer = await requireRole("SELLER", "MANAGER");
  const buyer = await getBuyerDetail((await params).id);
  if (!buyer) notFound();
  const assetParam = parseAssetParam(await searchParams);
  const contact = viewer.role === "SELLER" ? await getContactBuyerOptions(buyer.id) : null;
  // Back to the directory still ranked for the asset the seller came from.
  const rankedFrom = contact?.assets.some((asset) => asset.id === assetParam) ? assetParam : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={buyersHref({ ...DEFAULT_BUYER_FILTERS, rank: rankedFrom })}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All buyers
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <BuyerProfile buyer={buyer} />
          {contact && contact.assets.length > 0 && <BuyerFit assets={contact.assets} highlightId={rankedFrom} />}
        </div>
        <aside
          id="contact"
          className="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20"
        >
          <h2 className="text-lg font-semibold">Contact buyer</h2>
          {contact ? (
            <ContactBlock buyer={buyer} contact={contact} initialAssetId={rankedFrom} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sellers contact buyers about their own assets. Managers do not take part in conversations.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function BuyerProfile({ buyer }: { buyer: BuyerDetail }) {
  const { profile } = buyer;
  const title = buyer.companyName ?? buyer.name;
  const facts = [
    { label: "Buyer type", value: BUYER_TYPE_LABELS[profile.buyerType] },
    { label: "Ticket size", value: formatTicketRange(profile.ticketMinEur, profile.ticketMaxEur) },
    { label: "Business status", value: STATUS_PREF_LABELS[profile.statusPref] },
    { label: "Timeline", value: TIMELINE_LABELS[profile.timeline] },
  ];

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <Avatar name={title} className="size-14 text-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground">
            {buyer.companyName ? `${buyer.name} · ` : ""}
            {BUYER_TYPE_LABELS[profile.buyerType]}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden />
          Member since {formatDate(buyer.createdAt)}
        </span>
      </header>

      <Section title="Acquisition criteria">
        <dl className="grid gap-2 sm:grid-cols-2">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-row-border/60 px-3 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="text-right font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <ChipGroup
          label="Target categories"
          items={profile.categories.map((category) => ({ key: category, text: CATEGORY_LABELS[category] }))}
          empty="Any category"
        />
        <ChipGroup
          label="Target countries"
          items={profile.countries.map((code) => ({
            key: code,
            text: (
              <>
                <span aria-hidden>{countryFlag(code)}</span>
                {countryName(code)}
              </>
            ),
          }))}
          empty="Any country"
        />
      </Section>

      <Section title="Investment thesis">
        <p className="leading-relaxed whitespace-pre-line text-body">{profile.thesis}</p>
      </Section>
    </article>
  );
}

interface ContactBlockProps {
  buyer: BuyerDetail;
  contact: ContactBuyerOptions;
  initialAssetId: string | null;
}

function ContactBlock({ buyer, contact, initialAssetId }: ContactBlockProps) {
  const firstName = buyer.name.split(" ")[0];

  return (
    <>
      {contact.assets.length > 0 ? (
        <ContactBuyerForm
          buyerId={buyer.id}
          assets={contact.assets.map(({ id, title, match }) => ({ id, title, match }))}
          initialAssetId={initialAssetId}
          threadByAsset={Object.fromEntries(contact.threads.map((thread) => [thread.assetId, thread.id]))}
          defaultBody={`Hello ${firstName}, your acquisition profile looks like a good fit for one of our listings. Would you like to receive more details?`}
        />
      ) : (
        // SPEC §9: a seller with no published assets has nothing to offer yet.
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            You contact buyers about one of your published assets, and you have none yet. Publish an asset first.
          </p>
          <Button asChild className="h-10 rounded-full">
            <Link href="/seller/assets/new">
              <PackagePlus aria-hidden />
              Publish an asset
            </Link>
          </Button>
        </div>
      )}

      {contact.threads.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Your conversations with this buyer</h3>
          <ul className="flex flex-col gap-1">
            {contact.threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={conversationPath(thread.id)}
                  className="line-clamp-1 text-sm text-primary hover:underline"
                >
                  {thread.assetTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

interface ChipGroupProps {
  label: string;
  items: { key: string; text: ReactNode }[];
  empty: string;
}

function ChipGroup({ label, items, empty }: ChipGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm text-muted-foreground">{label}</h3>
      {items.length === 0 ? (
        <p className="text-sm font-semibold">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.key}>
              <Badge variant="outline" className="h-7 border-row-border px-3 text-sm font-normal">
                {item.text}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
