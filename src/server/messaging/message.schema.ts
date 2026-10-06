import "server-only";

import { z } from "zod";

import { MESSAGE_MAX_LENGTH } from "@/lib/messaging";
import { recordId } from "@/server/form-fields";

// Messaging inputs (SPEC §5 S2, §9). Every payload comes from the browser, so every field is
// parsed here even though the client components are typed.

const body = z
  .string()
  .trim()
  .min(1, { error: "Write a message first." })
  .max(MESSAGE_MAX_LENGTH, { error: `A message can be at most ${MESSAGE_MAX_LENGTH} characters.` });

/** A reply in an existing thread. */
export const sendMessageSchema = z.object({ conversationId: recordId, body });

/** Buyer → seller, from an asset (S4). */
export const startConversationSchema = z.object({ assetId: recordId, body });

/** Seller → buyer, about one of the seller's own published assets (S9). */
export const contactBuyerSchema = z.object({ buyerId: recordId, assetId: recordId, body });

/** "I have seen everything up to `seenAt`": the newest message the thread showed. */
export const markReadSchema = z.object({
  conversationId: recordId,
  seenAt: z.iso.datetime().transform((value) => new Date(value)),
});
