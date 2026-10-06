"use client";

import { startTransition, useEffect } from "react";

import { markConversationReadAction } from "@/server/messaging/message.actions";

interface MarkReadProps {
  conversationId: string;
  seenAt: string;
}

export function MarkRead({ conversationId, seenAt }: MarkReadProps) {
  useEffect(() => {
    startTransition(async () => {
      try {
        await markConversationReadAction({ conversationId, seenAt });
      } catch {}
    });
  }, [conversationId, seenAt]);

  return null;
}
