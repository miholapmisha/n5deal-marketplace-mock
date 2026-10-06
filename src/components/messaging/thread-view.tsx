"use client";

import { Ban } from "lucide-react";
import { useOptimistic } from "react";
import { cn } from "cn";

import { LocalTime } from "@/components/messaging/local-time";
import { MessageComposer } from "@/components/messaging/message-composer";
import type { ThreadMessage } from "@/lib/messaging";
import { sendMessageAction } from "@/server/messaging/message.actions";

interface ThreadViewProps {
  conversationId: string;
  counterpartName: string;
  messages: ThreadMessage[];
  hasEarlier: boolean;
  /** Set when the counterpart is suspended or removed: banner + disabled composer. */
  blockedReason: string | null;
}

/** S2 right pane body: the messages, newest at the bottom, and the reply box. */
export function ThreadView({ conversationId, counterpartName, messages, hasEarlier, blockedReason }: ThreadViewProps) {
  // A sent message shows at once; the server's re-render replaces it with the stored one.
  const [shown, addOptimistic] = useOptimistic(messages, (current: ThreadMessage[], added: ThreadMessage) => [
    ...current,
    added,
  ]);

  async function send(body: string): Promise<string | null> {
    addOptimistic({ id: `pending-${Date.now()}`, body, createdAt: new Date(), mine: true, pending: true });
    const result = await sendMessageAction({ conversationId, body });
    return result.error ?? null;
  }

  return (
    <>
      {blockedReason && (
        <div role="status" className="flex items-start gap-2 border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Ban className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p>{blockedReason}</p>
        </div>
      )}

      {/* column-reverse: the browser starts scrolled to the bottom and stays there as messages arrive. */}
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-4 py-4">
        <ol aria-label="Messages" className="flex flex-col gap-3">
          {hasEarlier && (
            <li className="text-center text-xs text-muted-foreground">Only the latest messages are shown.</li>
          )}
          {shown.map((message) => (
            <MessageBubble key={message.id} message={message} counterpartName={counterpartName} />
          ))}
        </ol>
      </div>

      <div className="border-t border-border bg-muted/50 px-3 pt-3 pb-1.5 sm:px-4">
        <MessageComposer
          label={`Reply to ${counterpartName}`}
          placeholder={blockedReason ? "Replies are disabled in this conversation." : "Write a reply…"}
          disabled={blockedReason !== null}
          clearOnSend
          onSend={send}
        />
      </div>
    </>
  );
}

function MessageBubble({ message, counterpartName }: { message: ThreadMessage; counterpartName: string }) {
  return (
    <li className={cn("flex flex-col gap-1", message.mine ? "items-end" : "items-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word sm:max-w-[75%]",
          message.mine
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-row-border/60 bg-row text-body",
          message.pending && "opacity-70",
        )}
      >
        <span className="sr-only">{message.mine ? "You" : counterpartName}: </span>
        {message.body}
      </p>
      <span className="px-1 text-[11px] text-muted-foreground">
        {message.pending ? "Sending…" : <LocalTime date={message.createdAt} variant="message" />}
      </span>
    </li>
  );
}
