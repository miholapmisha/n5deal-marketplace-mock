import "server-only";

import type { AssetStatus, Role, UserStatus } from "@/generated/prisma/client";
import type { AssetModeration, UserModeration } from "@/lib/moderation";

// SPEC §4.3 — who a manager may act on, and which status each action starts from and leads
// to. Pure, like the visibility rules: the service applies them, the screens use them to
// decide which buttons to show, and M9's unit tests cover them without a database.

interface Transition<S extends string> {
  from: readonly S[];
  to: S;
  /** Shown when the target is no longer in a `from` status (stale page, another manager). */
  refusal: string;
}

export const USER_TRANSITIONS: Record<UserModeration, Transition<UserStatus>> = {
  SUSPEND_USER: { from: ["ACTIVE"], to: "SUSPENDED", refusal: "Only active accounts can be suspended." },
  REINSTATE_USER: { from: ["SUSPENDED"], to: "ACTIVE", refusal: "Only suspended accounts can be reinstated." },
  REMOVE_USER: { from: ["ACTIVE", "SUSPENDED"], to: "REMOVED", refusal: "This account has already been removed." },
};

export const ASSET_TRANSITIONS: Record<AssetModeration, Transition<AssetStatus>> = {
  HIDE_ASSET: { from: ["PUBLISHED"], to: "HIDDEN", refusal: "Only published assets can be hidden." },
  UNHIDE_ASSET: { from: ["HIDDEN"], to: "PUBLISHED", refusal: "This asset is not hidden." },
  REMOVE_ASSET: { from: ["DRAFT", "PUBLISHED", "HIDDEN"], to: "REMOVED", refusal: "This asset has already been removed." },
};

/** Why this manager may not act on this user at all, or null if they may. */
export function userModerationBlock(manager: { id: string }, target: { id: string; role: Role }): string | null {
  if (target.id === manager.id) return "You cannot moderate your own account.";
  if (target.role === "MANAGER") return "Platform managers cannot be moderated.";
  return null;
}

/** The actions that apply to a user in this status, in button order. */
export function userActionsFor(status: UserStatus): UserModeration[] {
  return (Object.keys(USER_TRANSITIONS) as UserModeration[]).filter((action) =>
    USER_TRANSITIONS[action].from.includes(status),
  );
}

/** The actions that apply to an asset in this status, in button order. */
export function assetActionsFor(status: AssetStatus): AssetModeration[] {
  return (Object.keys(ASSET_TRANSITIONS) as AssetModeration[]).filter((action) =>
    ASSET_TRANSITIONS[action].from.includes(status),
  );
}

/**
 * What a removal must be confirmed with: the company the account trades as, or the person's
 * name when there is none (SPEC §5 S11). Typing it proves the manager picked the right row.
 */
export function removalConfirmation(target: { name: string; companyName: string | null }): string {
  return (target.companyName ?? target.name).trim();
}
