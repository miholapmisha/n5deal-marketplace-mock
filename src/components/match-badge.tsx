import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

/** Scores from here up read as a strong fit (green); from MEDIUM up as a fair one (accent). */
const STRONG = 75;
const MEDIUM = 50;

function tone(score: number): string {
  if (score >= STRONG) return "border-success/30 bg-success/10 text-success";
  if (score >= MEDIUM) return "border-primary/25 bg-secondary text-primary";
  return "border-row-border bg-muted text-muted-foreground";
}

interface MatchBadgeProps {
  /** 0–100 (SPEC §4.4). */
  score: number;
  className?: string;
}

/** "92% match": the match score between an asset and a buyer profile, in either direction. */
export function MatchBadge({ score, className }: MatchBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-semibold tabular-nums", tone(score), className)}>
      {score}% match
    </Badge>
  );
}
