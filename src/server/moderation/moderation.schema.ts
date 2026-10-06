import "server-only";

import { z } from "zod";

import { ASSET_MODERATIONS, REASON_MAX_LENGTH, REASON_MIN_LENGTH, USER_MODERATIONS } from "@/lib/moderation";
import { recordId } from "@/server/form-fields";

const reason = z
  .string({ error: `Give a reason of at least ${REASON_MIN_LENGTH} characters.` })
  .trim()
  .min(REASON_MIN_LENGTH, { error: `Give a reason of at least ${REASON_MIN_LENGTH} characters.` })
  .max(REASON_MAX_LENGTH, { error: `Keep the reason under ${REASON_MAX_LENGTH} characters.` });

/** Which record and which action: hidden inputs, so a failure means a stale or forged form. */
export const moderateUserTargetSchema = z.object({
  userId: recordId,
  action: z.enum(USER_MODERATIONS),
});

export const moderateAssetTargetSchema = z.object({
  assetId: recordId,
  action: z.enum(ASSET_MODERATIONS),
});

/** What the manager typed. Checked apart from the target so errors land on the right field. */
export const moderationInputSchema = z.object({
  reason,
  /** Removal only: the typed company name. Compared in the service, which knows the target. */
  confirmation: z.string().trim().max(200).optional(),
});

export type ModerateUserInput = z.output<typeof moderateUserTargetSchema> & z.output<typeof moderationInputSchema>;
export type ModerateAssetInput = z.output<typeof moderateAssetTargetSchema> & z.output<typeof moderationInputSchema>;
