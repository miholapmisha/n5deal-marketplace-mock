import type { ModerationAction } from "@/generated/prisma/enums";

// Moderation vocabulary shared by the manager screens (client) and the moderation module
// (server). Pure and client-safe; the rules themselves live in server/policies.

export const USER_MODERATIONS = ["SUSPEND_USER", "REINSTATE_USER", "REMOVE_USER"] as const;
export const ASSET_MODERATIONS = ["HIDE_ASSET", "UNHIDE_ASSET", "REMOVE_ASSET"] as const;

export type UserModeration = (typeof USER_MODERATIONS)[number];
export type AssetModeration = (typeof ASSET_MODERATIONS)[number];

/** SPEC §4.3: every action needs a reason. It is shown to suspended users and asset owners. */
export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 500;

/** How each action reads in the moderation log. */
export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  SUSPEND_USER: "Suspended",
  REINSTATE_USER: "Reinstated",
  REMOVE_USER: "Removed account",
  HIDE_ASSET: "Hid asset",
  UNHIDE_ASSET: "Unhid asset",
  REMOVE_ASSET: "Removed asset",
};

/** Returned to `useActionState` by the moderation dialogs. */
export interface ModerationFormState {
  /** Set on success, so the dialog knows to close. */
  ok?: boolean;
  error?: string;
  fieldErrors?: { reason?: string[]; confirmation?: string[] };
}
