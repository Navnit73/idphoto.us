/**
 * Photo specs supported by the PixPassport API (mirrors its `GET /countries`).
 * `code` is the API's identifier, sent as-is: most are ISO 3166 alpha-2, but a
 * few aren't (`PER`, `CHE`, `EU`, `BR-3*4`, and `NI` for Nigeria). Width and
 * height are the output size in pixels.
 */
export const PHOTO_COUNTRIES = [
  { code: "DZ", name: "Algeria", width: 413, height: 531 },
  { code: "AR", name: "Argentina", width: 945, height: 945 },
  { code: "AU", name: "Australia", width: 413, height: 531 },
  { code: "AT", name: "Austria", width: 413, height: 531 },
  { code: "BH", name: "Bahrain", width: 945, height: 1417 },
  { code: "BE", name: "Belgium", width: 413, height: 531 },
  { code: "BT", name: "Bhutan", width: 413, height: 531 },
  { code: "BR", name: "Brazil", width: 591, height: 827 },
  { code: "BR-3*4", name: "Brazil (3 × 4 foto)", width: 354, height: 472 },
  { code: "BG", name: "Bulgaria", width: 413, height: 531 },
  { code: "CA", name: "Canada", width: 1200, height: 1800 },
  { code: "CN", name: "China", width: 420, height: 560 },
  { code: "CO", name: "Colombia", width: 709, height: 945 },
  { code: "HR", name: "Croatia", width: 413, height: 531 },
  { code: "CZ", name: "Czechia", width: 413, height: 531 },
  { code: "DK", name: "Denmark", width: 413, height: 531 },
  { code: "EE", name: "Estonia", width: 1300, height: 1600 },
  { code: "FI", name: "Finland", width: 500, height: 653 },
  { code: "FR", name: "France", width: 630, height: 810 },
  { code: "DE", name: "Germany", width: 413, height: 531 },
  { code: "GR", name: "Greece", width: 413, height: 531 },
  { code: "HK", name: "Hong Kong", width: 1280, height: 1600 },
  { code: "HU", name: "Hungary", width: 413, height: 531 },
  { code: "IS", name: "Iceland", width: 827, height: 1063 },
  { code: "IN", name: "India", width: 630, height: 810 },
  { code: "ID", name: "Indonesia", width: 400, height: 600 },
  { code: "IR", name: "Iran", width: 600, height: 400 },
  { code: "IQ", name: "Iraq", width: 413, height: 531 },
  { code: "IE", name: "Ireland", width: 715, height: 951 },
  { code: "IT", name: "Italy", width: 413, height: 531 },
  { code: "JP", name: "Japan", width: 827, height: 1063 },
  { code: "KZ", name: "Kazakhstan", width: 413, height: 531 },
  { code: "LV", name: "Latvia", width: 413, height: 531 },
  { code: "LT", name: "Lithuania", width: 413, height: 531 },
  { code: "LU", name: "Luxembourg", width: 413, height: 531 },
  { code: "MW", name: "Malawi", width: 413, height: 531 },
  { code: "MY", name: "Malaysia", width: 827, height: 1181 },
  { code: "MT", name: "Malta", width: 413, height: 531 },
  { code: "MX", name: "Mexico", width: 413, height: 531 },
  { code: "NP", name: "Nepal", width: 413, height: 531 },
  { code: "NL", name: "Netherlands", width: 413, height: 531 },
  { code: "NZ", name: "New Zealand", width: 900, height: 1200 },
  { code: "NI", name: "Nigeria", width: 600, height: 800 },
  { code: "NO", name: "Norway", width: 413, height: 531 },
  { code: "PER", name: "Peru", width: 413, height: 531 },
  { code: "PH", name: "Philippines", width: 827, height: 1063 },
  { code: "PL", name: "Poland", width: 413, height: 531 },
  { code: "PT", name: "Portugal", width: 413, height: 531 },
  { code: "RO", name: "Romania", width: 413, height: 531 },
  { code: "EU", name: "Schengen visa", width: 630, height: 810 },
  { code: "SG", name: "Singapore", width: 400, height: 514 },
  { code: "SK", name: "Slovakia", width: 413, height: 531 },
  { code: "SI", name: "Slovenia", width: 413, height: 531 },
  { code: "ZA", name: "South Africa", width: 413, height: 531 },
  { code: "KR", name: "South Korea", width: 413, height: 531 },
  { code: "ES", name: "Spain", width: 413, height: 531 },
  { code: "LK", name: "Sri Lanka", width: 413, height: 531 },
  { code: "SE", name: "Sweden", width: 413, height: 531 },
  { code: "CHE", name: "Switzerland", width: 413, height: 531 },
  { code: "TJ", name: "Tajikistan", width: 413, height: 531 },
  { code: "TH", name: "Thailand", width: 413, height: 531 },
  { code: "TR", name: "Turkey", width: 591, height: 709 },
  { code: "AE", name: "United Arab Emirates", width: 413, height: 531 },
  { code: "GB", name: "United Kingdom", width: 600, height: 750 },
  { code: "US", name: "United States", width: 600, height: 600 },
] as const;

export type PhotoCountry = (typeof PHOTO_COUNTRIES)[number];
export type CountryCode = PhotoCountry["code"];

/** Tuple of codes, for `z.enum`. */
export const COUNTRY_CODES = PHOTO_COUNTRIES.map((country) => country.code) as [CountryCode, ...CountryCode[]];

export const DOCUMENT_TYPES = ["passport"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DEFAULT_COUNTRY: CountryCode = "US";

export function getCountry(code: string): PhotoCountry | undefined {
  return PHOTO_COUNTRIES.find((country) => country.code === code);
}

/** The API codes that aren't ISO 3166 alpha-2, mapped to the region they mean. */
const ISO_OVERRIDES: Partial<Record<CountryCode, string>> = { PER: "PE", CHE: "CH", NI: "NG", "BR-3*4": "BR" };

/** Two-letter region code for display (`EU` stays `EU`). */
export function displayCode(code: CountryCode): string {
  return ISO_OVERRIDES[code] ?? code;
}

/** Flag emoji built from regional indicator symbols. Windows shows the letters instead of a flag. */
export function flagEmoji(code: CountryCode): string {
  return String.fromCodePoint(...[...displayCode(code)].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}
