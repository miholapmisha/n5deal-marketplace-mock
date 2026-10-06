import type { ModerationAction } from "@/generated/prisma/enums";

export const USER_MODERATIONS = ["SUSPEND_USER", "REINSTATE_USER", "REMOVE_USER"] as const;
export const ASSET_MODERATIONS = ["HIDE_ASSET", "UNHIDE_ASSET", "REMOVE_ASSET"] as const;

export type UserModeration = (typeof USER_MODERATIONS)[number];
export type AssetModeration = (typeof ASSET_MODERATIONS)[number];

export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  SUSPEND_USER: "Suspended",
  REINSTATE_USER: "Reinstated",
  REMOVE_USER: "Removed account",
  HIDE_ASSET: "Hid asset",
  UNHIDE_ASSET: "Unhid asset",
  REMOVE_ASSET: "Removed asset",
};

export interface ModerationFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: { reason?: string[]; confirmation?: string[] };
}
