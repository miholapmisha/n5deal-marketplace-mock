// Named groups of countries (SPEC §7). AI search picks a region by name and this table
// expands it, so the 27 EU members come from code, not from a model's memory. The catalog
// chips use the same table to show a whole region as one chip. Pure and client-safe.

const EU = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;
const EEA = [...EU, "IS", "LI", "NO"] as const;

export const REGIONS = {
  EU,
  EEA,
  /** What a buyer usually means by "Europe" in a licensing context: the EEA, the UK, and Switzerland. */
  EUROPE: [...EEA, "GB", "CH"],
  BALTICS: ["EE", "LV", "LT"],
  NORDICS: ["DK", "FI", "IS", "NO", "SE"],
  DACH: ["DE", "AT", "CH"],
  BENELUX: ["BE", "NL", "LU"],
  NORTH_AMERICA: ["US", "CA"],
} as const satisfies Record<string, readonly string[]>;

export type Region = keyof typeof REGIONS;

export const REGION_KEYS = Object.keys(REGIONS) as [Region, ...Region[]];

export const REGION_LABELS: Record<Region, string> = {
  EU: "EU",
  EEA: "EEA",
  EUROPE: "Europe",
  BALTICS: "Baltics",
  NORDICS: "Nordics",
  DACH: "DACH",
  BENELUX: "Benelux",
  NORTH_AMERICA: "North America",
};

/** Every country in the given regions, each once, in table order. */
export function regionCountries(regions: readonly Region[]): string[] {
  return [...new Set(regions.flatMap((region) => REGIONS[region]))];
}

/** The region made of exactly these countries (order ignored), or null. */
export function regionOf(countries: readonly string[]): Region | null {
  const selected = new Set(countries);
  return (
    REGION_KEYS.find((region) => {
      const members: readonly string[] = REGIONS[region];
      return members.length === selected.size && members.every((code) => selected.has(code));
    }) ?? null
  );
}
