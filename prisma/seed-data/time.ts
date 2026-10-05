// Every seeded timestamp is derived from one fixed anchor, so the data (and "Newest"
// ordering) is identical on every run instead of depending on when the seed ran.
export const SEED_ANCHOR = new Date("2026-09-30T09:00:00.000Z");

const HOUR_MS = 60 * 60 * 1000;

export function daysAgo(days: number, hours = 0): Date {
  return new Date(SEED_ANCHOR.getTime() - (days * 24 + hours) * HOUR_MS);
}
