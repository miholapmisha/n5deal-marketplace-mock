const EU = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;
const EEA = [...EU, "IS", "LI", "NO"] as const;

export const REGIONS = {
  EU,
  EEA,
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

export function regionCountries(regions: readonly Region[]): string[] {
  return [...new Set(regions.flatMap((region) => REGIONS[region]))];
}

export function regionOf(countries: readonly string[]): Region | null {
  const selected = new Set(countries);
  return (
    REGION_KEYS.find((region) => {
      const members: readonly string[] = REGIONS[region];
      return members.length === selected.size && members.every((code) => selected.has(code));
    }) ?? null
  );
}
