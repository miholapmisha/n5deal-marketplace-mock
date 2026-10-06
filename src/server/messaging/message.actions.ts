"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { conversationPath, type MessageActionResult, MESSAGES_PATH } from "@/lib/messaging";
import {
  contactBuyerSchema,
  markReadSchema,
  sendMessageSchema,
  startConversationSchema,
} from "@/server/messaging/message.schema";
import {
  contactBuyer,
  markConversationRead,
  sendMessage,
  startConversation,
} from "@/server/messaging/message.service";

// Entry points for the composers (S2, S4 → S2, S9): parse → service (participants, statuses)
// → revalidate. Payloads are typed for the client and parsed as untrusted input here.

const STALE_FORM = "This conversation is out of date. Refresh the page and try again.";

/** The message's own error ("Write a message first."), or a generic one for tampered IDs. */
function invalidInput(error: z.ZodError): MessageActionResult {
  const bodyIssue = error.issues.find((issue) => issue.path[0] === "body");
  return { error: bodyIssue?.message ?? STALE_FORM };
}

/**
 * The conversation list lives in the messages layout, so revalidate the layout: the action's
 * response then re-renders the list, the open thread, and the header's unread count.
 */
function revalidateMessages(): void {
  revalidatePath(MESSAGES_PATH, "layout");
}

export interface SendMessagePayload {
  conversationId: string;
  body: string;
}

export async function sendMessageAction(payload: SendMessagePayload): Promise<MessageActionResult> {
  const parsed = sendMessageSchema.safeParse(payload);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await sendMessage(parsed.data.conversationId, parsed.data.body);
  if (!result.ok) return { error: result.error };

  revalidateMessages();
  return {};
}

export interface StartConversationPayload {
  assetId: string;
  body: string;
}

/** Buyer's first message about an asset. Redirects to the thread on success. */
export async function startConversationAction(payload: StartConversationPayload): Promise<MessageActionResult> {
  const parsed = startConversationSchema.safeParse(payload);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await startConversation(parsed.data.assetId, parsed.data.body);
  if (!result.ok) return { error: result.error };

  revalidateMessages();
  redirect(conversationPath(result.conversationId));
}

export interface ContactBuyerPayload {
  buyerId: string;
  assetId: string;
  body: string;
}

/** Seller's first message to a buyer. Redirects to the thread on success. */
export async function contactBuyerAction(payload: ContactBuyerPayload): Promise<MessageActionResult> {
  const parsed = contactBuyerSchema.safeParse(payload);
  if (!parsed.success) return invalidInput(parsed.error);

  const result = await contactBuyer(parsed.data.buyerId, parsed.data.assetId, parsed.data.body);
  if (!result.ok) return { error: result.error };

  revalidateMessages();
  redirect(conversationPath(result.conversationId));
}

export interface MarkReadPayload {
  conversationId: string;
  /** ISO timestamp of the newest message the thread showed. */
  seenAt: string;
}

/** Fired by the thread once it is on screen. Re-renders only when a marker moved. */
export async function markConversationReadAction(payload: MarkReadPayload): Promise<void> {
  const parsed = markReadSchema.safeParse(payload);
  if (!parsed.success) return;

  const changed = await markConversationRead(parsed.data.conversationId, parsed.data.seenAt);
  if (changed) revalidateMessages();
}
