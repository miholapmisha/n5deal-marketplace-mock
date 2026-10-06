import "server-only";

import { z } from "zod";

import { ASSET_MODERATIONS, REASON_MAX_LENGTH, REASON_MIN_LENGTH, USER_MODERATIONS } from "@/lib/moderation";
import { recordId } from "@/server/form-fields";

const reason = z
  .string({ error: `Give a reason of at least ${REASON_MIN_LENGTH} characters.` })
  .trim()
  .min(REASON_MIN_LENGTH, { error: `Give a reason of at least ${REASON_MIN_LENGTH} characters.` })
  .max(REASON_MAX_LENGTH, { error: `Keep the reason under ${REASON_MAX_LENGTH} characters.` });

export const moderateUserTargetSchema = z.object({
  userId: recordId,
  action: z.enum(USER_MODERATIONS),
});

export const moderateAssetTargetSchema = z.object({
  assetId: recordId,
  action: z.enum(ASSET_MODERATIONS),
});

export const moderationInputSchema = z.object({
  reason,
  confirmation: z.string().trim().max(200).optional(),
});

export type ModerateUserInput = z.output<typeof moderateUserTargetSchema> & z.output<typeof moderationInputSchema>;
export type ModerateAssetInput = z.output<typeof moderateAssetTargetSchema> & z.output<typeof moderationInputSchema>;
