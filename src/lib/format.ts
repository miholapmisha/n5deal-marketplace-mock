const compactEur = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 2,
});

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function formatPrice(priceEur: number | null): string {
  return priceEur === null ? "Price on request" : compactEur.format(priceEur);
}

export function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const REGIONAL_INDICATOR_A = 0x1f1e6;

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return [...code.toUpperCase()]
    .map((char) => String.fromCodePoint(REGIONAL_INDICATOR_A + char.charCodeAt(0) - 65))
    .join("");
}

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: Date): string {
  return shortDate.format(date);
}

export function formatTicketRange(minEur: number | null, maxEur: number | null): string {
  if (minEur !== null && maxEur !== null) return `${compactEur.format(minEur)} – ${compactEur.format(maxEur)}`;
  if (minEur !== null) return `From ${compactEur.format(minEur)}`;
  if (maxEur !== null) return `Up to ${compactEur.format(maxEur)}`;
  return "Not specified";
}
