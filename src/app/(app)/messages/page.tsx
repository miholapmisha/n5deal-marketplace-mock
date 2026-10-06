import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";

import { requireRole } from "@/server/auth/guards";
import { listConversations } from "@/server/messaging/message.service";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const user = await requireRole("BUYER", "SELLER");
  const conversations = await listConversations();
  const text =
    conversations.length > 0
      ? "Pick a conversation on the left to read it and reply."
      : user.role === "BUYER"
        ? "Conversations with sellers appear here once you contact one from an asset page."
        : "Conversations with buyers appear here once a buyer contacts you or you contact one.";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <MessagesSquare className="size-10 text-primary/60" aria-hidden />
      <p className="font-semibold">{conversations.length > 0 ? "Select a conversation" : "Your inbox is empty"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
