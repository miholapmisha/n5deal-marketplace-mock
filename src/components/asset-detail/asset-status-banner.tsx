import { CircleAlert, EyeOff, FilePen } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

import type { AssetDetailView } from "@/server/assets/asset.service";

interface Banner {
  tone: "info" | "warning" | "danger";
  icon: ReactNode;
  title: string;
  detail: string | null;
}

/** Why this asset is not in the public catalog, or null if it is. Owners and managers only. */
function bannerFor({ asset, isPublic, sellerStatus, isOwner }: AssetDetailView): Banner | null {
  if (isPublic) return null;
  switch (asset.status) {
    case "DRAFT":
      return {
        tone: "info",
        icon: <FilePen aria-hidden />,
        title: "Draft — not visible in the catalog",
        detail: isOwner ? "Only you can see this page until the asset is published." : null,
      };
    case "HIDDEN":
      return {
        tone: "warning",
        icon: <EyeOff aria-hidden />,
        title: "Hidden by a platform manager",
        detail: asset.statusReason,
      };
    case "REMOVED":
      return {
        tone: "danger",
        icon: <CircleAlert aria-hidden />,
        title: "Removed by a platform manager",
        detail: asset.statusReason,
      };
    case "PUBLISHED":
      // Published but not public: the seller is suspended or removed (visibility is derived).
      return {
        tone: "warning",
        icon: <CircleAlert aria-hidden />,
        title: `Not public: the seller's account is ${sellerStatus.toLowerCase()}`,
        detail: "The listing reappears automatically if the seller is reinstated.",
      };
  }
}

const TONE_CLASSES: Record<Banner["tone"], string> = {
  info: "border-row-border bg-secondary text-foreground [&_svg]:text-primary",
  warning: "border-warning/30 bg-warning/10 text-foreground [&_svg]:text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-foreground [&_svg]:text-destructive",
};

export function AssetStatusBanner({ view }: { view: AssetDetailView }) {
  const banner = bannerFor(view);
  if (!banner) return null;

  return (
    <div role="status" className={cn("flex gap-3 rounded-2xl border p-4 [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0", TONE_CLASSES[banner.tone])}>
      {banner.icon}
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{banner.title}</p>
        {banner.detail && <p className="text-sm text-muted-foreground">{banner.detail}</p>}
      </div>
    </div>
  );
}
