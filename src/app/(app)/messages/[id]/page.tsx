import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarkRead } from "@/components/messaging/mark-read";
import { ThreadHeader } from "@/components/messaging/thread-header";
import { ThreadView } from "@/components/messaging/thread-view";
import { ROLE_LABELS } from "@/lib/labels";
import { requireRole } from "@/server/auth/guards";
import { getConversationView } from "@/server/messaging/message.service";

export async function generateMetadata({ params }: PageProps<"/messages/[id]">): Promise<Metadata> {
  const view = await getConversationView((await params).id);
  return { title: view ? `${view.counterpart.name} · Messages` : "Conversation not found" };
}

// S2 thread. Not a participant (or no such thread) → 404, the same answer for both.
export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  await requireRole("BUYER", "SELLER");
  const view = await getConversationView((await params).id);
  if (!view) notFound();
  const { counterpart } = view;

  return (
    <>
      <ThreadHeader
        title={counterpart.name}
        subtitle={[counterpart.personName, ROLE_LABELS[counterpart.side]].filter(Boolean).join(" · ")}
        profileHref={counterpart.profileHref}
        asset={view.asset}
      />
      <ThreadView
        key={view.id}
        conversationId={view.id}
        counterpartName={counterpart.name}
        messages={view.messages}
        hasEarlier={view.hasEarlier}
        blockedReason={view.blockedReason}
      />
      {view.unread && <MarkRead conversationId={view.id} seenAt={view.lastMessageAt.toISOString()} />}
    </>
  );
}
