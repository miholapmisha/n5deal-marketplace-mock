import { ConversationList } from "@/components/messaging/conversation-list";
import { MessagesPanes } from "@/components/messaging/messages-panes";
import { requireRole } from "@/server/auth/guards";
import { listConversations } from "@/server/messaging/message.service";

// S2. The list lives in the layout, so switching threads keeps it in place and only the
// right pane loads. Pages still call requireRole(): layouts do not re-run on client
// navigation. Sending and marking read revalidate this layout, which refreshes the list.
export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const user = await requireRole("BUYER", "SELLER");
  const conversations = await listConversations();
  const role = user.role === "BUYER" ? "BUYER" : "SELLER";

  return (
    <MessagesPanes list={<ConversationList conversations={conversations} role={role} />}>{children}</MessagesPanes>
  );
}
