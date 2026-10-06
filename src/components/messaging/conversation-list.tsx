import { Inbox, Search, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { Avatar } from "@/components/messaging/avatar";
import { ConversationLink } from "@/components/messaging/conversation-link";
import { LocalTime } from "@/components/messaging/local-time";
import { Button } from "@/components/ui/button";
import { CATALOG_PATH } from "@/lib/catalog-filters";
import { countryFlag } from "@/lib/format";
import type { ConversationListItem } from "@/server/messaging/message.service";

interface ConversationListProps {
  conversations: ConversationListItem[];
  role: "BUYER" | "SELLER";
}

/** S2 left pane. */
export function ConversationList({ conversations, role }: ConversationListProps) {
  const unread = conversations.filter((conversation) => conversation.unread).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Messages</h1>
        {unread > 0 && <span className="text-xs font-medium text-primary">{unread} unread</span>}
      </div>
      {conversations.length === 0 ? (
        <EmptyList role={role} />
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationLink id={conversation.id}>
                <ConversationRow conversation={conversation} />
              </ConversationLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: ConversationListItem }) {
  const { counterpartName, assetTitle, assetCountry, preview, lastMessageAt, unread } = conversation;

  return (
    <>
      <Avatar name={counterpartName} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{counterpartName}</span>
          <LocalTime date={lastMessageAt} variant="list" className="shrink-0 text-xs text-muted-foreground" />
        </span>
        <span className="truncate text-xs text-muted-foreground">
          <span aria-hidden className="mr-1">
            {countryFlag(assetCountry)}
          </span>
          {assetTitle}
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("line-clamp-1 text-sm", unread ? "text-foreground" : "text-muted-foreground")}>
            {preview?.mine && "You: "}
            {preview?.body}
          </span>
          {unread && (
            <>
              <span aria-hidden className="ml-auto size-2.5 shrink-0 rounded-full bg-primary" />
              <span className="sr-only">Unread</span>
            </>
          )}
        </span>
      </span>
    </>
  );
}

/** SPEC §5 S2: buyers are pointed to the catalog, sellers to the buyer directory. */
function EmptyList({ role }: { role: "BUYER" | "SELLER" }) {
  const cta =
    role === "BUYER"
      ? { href: CATALOG_PATH, label: "Browse assets", icon: <Search aria-hidden />, text: "Find an asset you like and contact its seller." }
      : { href: "/buyers", label: "Find buyers", icon: <Users aria-hidden />, text: "Find a buyer who fits one of your assets and say hello." };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="size-8 text-primary" aria-hidden />
      <p className="font-semibold">No conversations yet</p>
      <p className="max-w-64 text-sm text-muted-foreground">{cta.text}</p>
      <Button asChild className="mt-1 h-10 rounded-full px-5">
        <Link href={cta.href}>
          {cta.icon}
          {cta.label}
        </Link>
      </Button>
    </div>
  );
}
