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

const STALE_FORM = "This conversation is out of date. Refresh the page and try again.";

function invalidInput(error: z.ZodError): MessageActionResult {
  const bodyIssue = error.issues.find((issue) => issue.path[0] === "body");
  return { error: bodyIssue?.message ?? STALE_FORM };
}

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
  seenAt: string;
}

export async function markConversationReadAction(payload: MarkReadPayload): Promise<void> {
  const parsed = markReadSchema.safeParse(payload);
  if (!parsed.success) return;

  const changed = await markConversationRead(parsed.data.conversationId, parsed.data.seenAt);
  if (changed) revalidateMessages();
}
