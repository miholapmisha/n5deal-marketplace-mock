import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import type { AssetStatus } from "@/generated/prisma/enums";
import { ASSET_STATUS_LABELS } from "@/lib/labels";

const STATUS_CLASSES: Record<AssetStatus, string> = {
  DRAFT: "border-row-border bg-muted text-muted-foreground",
  PUBLISHED: "border-success/30 bg-success/10 text-success",
  HIDDEN: "border-warning/30 bg-warning/10 text-warning",
  REMOVED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={cn("h-6 px-2.5", STATUS_CLASSES[status])}>
      {ASSET_STATUS_LABELS[status]}
    </Badge>
  );
}
