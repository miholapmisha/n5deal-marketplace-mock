"use client";

import { useSyncExternalStore } from "react";
import { cn } from "cn";

// Message times in the reader's own time zone. The server does not know that zone, so the
// server render — and the first client render, which must match it — shows a fixed UTC
// format built by hand (Node and browsers ship different ICU data, see M4). Right after
// hydration the browser switches to local, relative times.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_MS = 6 * 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, "0");

/** "4 Oct, 14:05" in UTC, identical on every runtime. */
function utcLabel(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dayMonthFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const fullDateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const tooltipFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short" });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export type LocalTimeVariant = "list" | "message";

/** List: "14:05" today, "Mon" this week, "4 Oct" this year, "4 Oct 2025" before. */
function localLabel(date: Date, variant: LocalTimeVariant, now: Date): string {
  const time = timeFormat.format(date);
  if (sameDay(date, now)) return time;
  const sameYear = date.getFullYear() === now.getFullYear();
  const day = (sameYear ? dayMonthFormat : fullDateFormat).format(date);
  if (variant === "message") return `${day}, ${time}`;
  return now.getTime() - date.getTime() < WEEK_MS ? weekdayFormat.format(date) : day;
}

// "Now" for relative labels: read once per page load, so every label agrees and React sees a
// stable snapshot. The server snapshot is null: no local time before hydration.
let pageLoadedAt: number | null = null;
const subscribe = () => () => {};
const getClientNow = () => (pageLoadedAt ??= Date.now());
const getServerNow = () => null;

interface LocalTimeProps {
  date: Date;
  variant: LocalTimeVariant;
  className?: string;
}

export function LocalTime({ date, variant, className }: LocalTimeProps) {
  const now = useSyncExternalStore(subscribe, getClientNow, getServerNow);
  return (
    <time
      dateTime={date.toISOString()}
      title={now === null ? undefined : tooltipFormat.format(date)}
      className={cn("tabular-nums", className)}
    >
      {now === null ? utcLabel(date) : localLabel(date, variant, new Date(now))}
    </time>
  );
}
