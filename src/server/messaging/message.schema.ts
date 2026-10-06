import "server-only";

import { z } from "zod";

import { MESSAGE_MAX_LENGTH } from "@/lib/messaging";
import { recordId } from "@/server/form-fields";

const body = z
  .string()
  .trim()
  .min(1, { error: "Write a message first." })
  .max(MESSAGE_MAX_LENGTH, { error: `A message can be at most ${MESSAGE_MAX_LENGTH} characters.` });

export const sendMessageSchema = z.object({ conversationId: recordId, body });

export const startConversationSchema = z.object({ assetId: recordId, body });

export const contactBuyerSchema = z.object({ buyerId: recordId, assetId: recordId, body });

export const markReadSchema = z.object({
  conversationId: recordId,
  seenAt: z.iso.datetime().transform((value) => new Date(value)),
});
