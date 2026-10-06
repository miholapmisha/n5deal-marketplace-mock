"use client";

import { startTransition, useEffect } from "react";

import { markConversationReadAction } from "@/server/messaging/message.actions";

interface MarkReadProps {
  conversationId: string;
  /** ISO time of the newest message on screen: nothing newer is marked read. */
  seenAt: string;
}

/**
 * Rendered only while the open thread has unread messages. Marking read here, after the
 * thread is on screen, keeps the page render free of writes; the action's re-render then
 * clears the unread dot in the list and updates the header count.
 */
export function MarkRead({ conversationId, seenAt }: MarkReadProps) {
  useEffect(() => {
    startTransition(async () => {
      try {
        await markConversationReadAction({ conversationId, seenAt });
      } catch {
        // Not worth an error screen: the thread is readable, and the dot clears next visit.
      }
    });
  }, [conversationId, seenAt]);

  return null;
}
