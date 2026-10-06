import { LogIn, MessageSquare, MessagesSquare, Pencil } from "lucide-react";
import Link from "next/link";

import { UnpublishButton } from "@/components/asset-detail/unpublish-button";
import { AssetModerationButton } from "@/components/manager/moderation-buttons";
import { Button } from "@/components/ui/button";
import { conversationPath, newConversationPath } from "@/lib/messaging";
import type { AssetDetailView } from "@/server/assets/asset.service";
import { assetActionsFor } from "@/server/policies/moderation-rules";

const buttonClass = "h-10 w-full rounded-full";

/** The primary action for this viewer (SPEC §5 S4). */
export function AssetActions({ view }: { view: AssetDetailView }) {
  const { asset, viewerRole, isOwner, conversationId } = view;

  if (isOwner) {
    return (
      <div className="flex flex-col gap-2">
        <Button asChild className={buttonClass}>
          <Link href={`/seller/assets/${asset.id}/edit`}>
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
        {asset.status === "PUBLISHED" && <UnpublishButton assetId={asset.id} />}
      </div>
    );
  }

  switch (viewerRole) {
    case null:
      return (
        <div className="flex flex-col gap-2">
          <Button asChild className={buttonClass}>
            <Link href={`/login?next=${encodeURIComponent(`/assets/${asset.slug}`)}`}>
              <LogIn aria-hidden />
              Log in as a buyer to contact
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register as a buyer
            </Link>
          </p>
        </div>
      );
    case "BUYER":
      return conversationId ? (
        <Button asChild className={buttonClass}>
          <Link href={conversationPath(conversationId)}>
            <MessagesSquare aria-hidden />
            Open conversation
          </Link>
        </Button>
      ) : (
        <Button asChild className={buttonClass}>
          <Link href={newConversationPath(asset.slug)}>
            <MessageSquare aria-hidden />
            Contact seller
          </Link>
        </Button>
      );
    case "SELLER":
      return <p className="text-center text-sm text-muted-foreground">Only buyers can contact sellers about an asset.</p>;
    case "MANAGER":
      return <ManagerActions view={view} />;
  }
}

/** Hide / Unhide / Remove with a reason (SPEC §4.3); a removed asset has none left. */
function ManagerActions({ view: { asset } }: { view: AssetDetailView }) {
  const actions = assetActionsFor(asset.status);
  if (actions.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">This asset was removed. Removal cannot be undone.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => (
        <AssetModerationButton key={action} assetId={asset.id} assetTitle={asset.title} action={action} block />
      ))}
    </div>
  );
}
