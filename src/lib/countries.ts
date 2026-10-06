import { countryName } from "@/lib/format";

// ISO 3166-1 alpha-2, officially assigned codes only (249). Intl.DisplayNames alone is not
// enough to validate: it also names "EU", "UN", "UK", and retired codes such as "YU".
const ISO_ALPHA2 =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ " +
  "BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM " +
  "DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS " +
  "GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN " +
  "KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ " +
  "MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM " +
  "PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV " +
  "SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI " +
  "VN VU WF WS YE YT ZA ZM ZW";

export const COUNTRY_CODES: readonly string[] = ISO_ALPHA2.split(" ");

const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES);

/** Exact, upper-case match: "MT" → true; "mt", "EU", "XX" → false. */
export function isCountryCode(value: string): boolean {
  return COUNTRY_CODE_SET.has(value);
}

/**
 * Codes whose English name starts with the word or contains it as a whole word, so a
 * keyword search for "malta", "czech", or "kingdom" finds the country. A bare substring
 * match would turn the search "emi" into "United Arab Emirates".
 */
export function countryCodesMatching(word: string): string[] {
  const needle = word.trim().toLowerCase();
  if (needle.length < 3) return [];
  return COUNTRY_CODES.filter((code) => {
    const name = countryName(code).toLowerCase();
    return name.startsWith(needle) || name.split(/[\s,()&-]+/).includes(needle);
  });
}

export interface CountryOption {
  value: string;
  label: string;
}

/**
 * Every ISO country as a select option, sorted by English name. Build it on the server and
 * pass it to client components: browsers and Node ship different ICU data ("Falkland
 * Islands" vs "Falkland Islands (Islas Malvinas)"), so names computed on both sides would
 * break hydration.
 */
export const COUNTRY_OPTIONS: readonly CountryOption[] = COUNTRY_CODES.map((code) => ({
  value: code,
  label: countryName(code),
})).sort((a, b) => a.label.localeCompare(b.label, "en"));
