"use client";

import { Ban, Eye, EyeOff, type LucideIcon, RotateCcw, Trash2, UserX } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "cn";

import { ModerationDialog } from "@/components/manager/moderation-dialog";
import { Button } from "@/components/ui/button";
import type { AssetModeration, UserModeration } from "@/lib/moderation";
import { moderateAssetAction, moderateUserAction } from "@/server/moderation/moderation.actions";

interface ActionCopy {
  label: string;
  icon: LucideIcon;
  title: (name: string) => string;
  description: string;
  submit: string;
  pending: string;
  tone: "neutral" | "positive" | "danger";
}

const ASSET_COPY: Record<AssetModeration, ActionCopy> = {
  HIDE_ASSET: {
    label: "Hide",
    icon: EyeOff,
    title: (title) => `Hide “${title}”?`,
    description:
      "It leaves the catalog at once. The owner sees your reason and can still edit the listing, but only a manager can unhide it.",
    submit: "Hide asset",
    pending: "Hiding…",
    tone: "neutral",
  },
  UNHIDE_ASSET: {
    label: "Unhide",
    icon: Eye,
    title: (title) => `Unhide “${title}”?`,
    description: "It returns to the catalog in its original place, with its original publish date.",
    submit: "Unhide asset",
    pending: "Unhiding…",
    tone: "positive",
  },
  REMOVE_ASSET: {
    label: "Remove",
    icon: Trash2,
    title: (title) => `Remove “${title}”?`,
    description:
      "This cannot be undone. The listing disappears from the catalog and from the owner's assets; existing conversations stay readable.",
    submit: "Remove asset",
    pending: "Removing…",
    tone: "danger",
  },
};

const USER_COPY: Record<UserModeration, ActionCopy> = {
  SUSPEND_USER: {
    label: "Suspend",
    icon: Ban,
    title: (name) => `Suspend ${name}?`,
    description:
      "They are logged out at once and see your reason if they try to log in. Their listings and buyer profile disappear from the marketplace until you reinstate them.",
    submit: "Suspend",
    pending: "Suspending…",
    tone: "neutral",
  },
  REINSTATE_USER: {
    label: "Reinstate",
    icon: RotateCcw,
    title: (name) => `Reinstate ${name}?`,
    description: "They can log in again, and their listings and profile reappear exactly as they were.",
    submit: "Reinstate",
    pending: "Reinstating…",
    tone: "positive",
  },
  REMOVE_USER: {
    label: "Remove",
    icon: UserX,
    title: (name) => `Remove ${name}?`,
    description:
      "This cannot be undone. They are logged out, their name, email, and company are erased, their buyer profile is deleted, and every listing is removed. Conversations show “Removed user”.",
    submit: "Remove account",
    pending: "Removing…",
    tone: "danger",
  },
};

const TONE_VARIANTS = { neutral: "outline", positive: "secondary", danger: "destructive" } as const;

interface TriggerProps extends ComponentProps<typeof Button> {
  copy: ActionCopy;
  block: boolean;
  targetName: string;
}

function TriggerButton({ copy, block, targetName, ...props }: TriggerProps) {
  const Icon = copy.icon;
  return (
    <Button
      {...props}
      type="button"
      variant={TONE_VARIANTS[copy.tone]}
      size={block ? "default" : "sm"}
      aria-label={block ? undefined : `${copy.label} ${targetName}`}
      className={cn("rounded-full", block ? "h-10 w-full" : "px-3")}
    >
      <Icon aria-hidden />
      {copy.label}
    </Button>
  );
}

interface AssetModerationButtonProps {
  assetId: string;
  assetTitle: string;
  action: AssetModeration;
  block?: boolean;
}

export function AssetModerationButton({ assetId, assetTitle, action, block = false }: AssetModerationButtonProps) {
  const copy = ASSET_COPY[action];
  return (
    <ModerationDialog
      trigger={<TriggerButton copy={copy} block={block} targetName={assetTitle} />}
      title={copy.title(assetTitle)}
      description={copy.description}
      action={moderateAssetAction}
      fields={{ assetId, action }}
      submitLabel={copy.submit}
      pendingLabel={copy.pending}
      destructive={copy.tone === "danger"}
    />
  );
}

interface UserModerationButtonProps {
  userId: string;
  displayName: string;
  action: UserModeration;
  confirmText: string;
}

export function UserModerationButton({ userId, displayName, action, confirmText }: UserModerationButtonProps) {
  const copy = USER_COPY[action];
  return (
    <ModerationDialog
      trigger={<TriggerButton copy={copy} block={false} targetName={displayName} />}
      title={copy.title(displayName)}
      description={copy.description}
      action={moderateUserAction}
      fields={{ userId, action }}
      submitLabel={copy.submit}
      pendingLabel={copy.pending}
      destructive={copy.tone === "danger"}
      confirmText={action === "REMOVE_USER" ? confirmText : undefined}
    />
  );
}
