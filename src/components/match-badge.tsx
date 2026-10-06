import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

const STRONG = 75;
const MEDIUM = 50;

function tone(score: number): string {
  if (score >= STRONG) return "border-success/30 bg-success/10 text-success";
  if (score >= MEDIUM) return "border-primary/25 bg-secondary text-primary";
  return "border-row-border bg-muted text-muted-foreground";
}

interface MatchBadgeProps {
  score: number;
  className?: string;
}

export function MatchBadge({ score, className }: MatchBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-semibold tabular-nums", tone(score), className)}>
      {score}% match
    </Badge>
  );
}
