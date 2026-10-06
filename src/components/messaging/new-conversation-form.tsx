"use client";

import { MessageComposer } from "@/components/messaging/message-composer";
import { startConversationAction } from "@/server/messaging/message.actions";

interface NewConversationFormProps {
  assetId: string;
  defaultBody: string;
}

/** Buyer's first message about an asset. The action redirects to the new thread. */
export function NewConversationForm({ assetId, defaultBody }: NewConversationFormProps) {
  async function send(body: string): Promise<string | null> {
    const result = await startConversationAction({ assetId, body });
    return result.error ?? null;
  }

  return <MessageComposer label="Your first message" defaultBody={defaultBody} roomy onSend={send} />;
}
