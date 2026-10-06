import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/generated/prisma/enums";
import { USER_STATUS_LABELS } from "@/lib/labels";

const STATUS_CLASSES: Record<UserStatus, string> = {
  ACTIVE: "border-success/30 bg-success/10 text-success",
  SUSPENDED: "border-warning/30 bg-warning/10 text-warning",
  REMOVED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="outline" className={cn("h-6 px-2.5", STATUS_CLASSES[status])}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}
