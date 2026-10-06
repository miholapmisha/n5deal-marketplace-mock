import "server-only";

import type { AssetStatus, Role, UserStatus } from "@/generated/prisma/client";
import type { AssetModeration, UserModeration } from "@/lib/moderation";

interface Transition<S extends string> {
  from: readonly S[];
  to: S;
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

export function userModerationBlock(manager: { id: string }, target: { id: string; role: Role }): string | null {
  if (target.id === manager.id) return "You cannot moderate your own account.";
  if (target.role === "MANAGER") return "Platform managers cannot be moderated.";
  return null;
}

export function userActionsFor(status: UserStatus): UserModeration[] {
  return (Object.keys(USER_TRANSITIONS) as UserModeration[]).filter((action) =>
    USER_TRANSITIONS[action].from.includes(status),
  );
}

export function assetActionsFor(status: AssetStatus): AssetModeration[] {
  return (Object.keys(ASSET_TRANSITIONS) as AssetModeration[]).filter((action) =>
    ASSET_TRANSITIONS[action].from.includes(status),
  );
}

export function removalConfirmation(target: { name: string; companyName: string | null }): string {
  return (target.companyName ?? target.name).trim();
}
