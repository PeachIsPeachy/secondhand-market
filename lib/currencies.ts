/** Currencies offered in the UI (Frankfurter/ECB-backed; missing rates fall back to USD). */
export const DISPLAY_CURRENCIES = [
  { code: "USD", label: "USD — US dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British pound" },
  { code: "JPY", label: "JPY — Japanese yen" },
  { code: "CAD", label: "CAD — Canadian dollar" },
  { code: "AUD", label: "AUD — Australian dollar" },
  { code: "CHF", label: "CHF — Swiss franc" },
  { code: "CNY", label: "CNY — Chinese yuan" },
  { code: "HKD", label: "HKD — Hong Kong dollar" },
  { code: "SGD", label: "SGD — Singapore dollar" },
  { code: "NZD", label: "NZD — New Zealand dollar" },
  { code: "SEK", label: "SEK — Swedish krona" },
  { code: "NOK", label: "NOK — Norwegian krone" },
  { code: "INR", label: "INR — Indian rupee" },
  { code: "MXN", label: "MXN — Mexican peso" },
  { code: "KRW", label: "KRW — South Korean won" },
  { code: "PLN", label: "PLN — Polish złoty" },
] as const;

export type DisplayCurrencyCode = (typeof DISPLAY_CURRENCIES)[number]["code"];

export const DISPLAY_CURRENCY_CODES = DISPLAY_CURRENCIES.map((c) => c.code);

export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrencyCode = "USD";

const ZERO_DECIMAL = new Set<string>(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

export function fractionDigitsForCurrency(code: string): number {
  return ZERO_DECIMAL.has(code) ? 0 : 2;
}

export function isSupportedDisplayCurrency(code: string): code is DisplayCurrencyCode {
  return DISPLAY_CURRENCY_CODES.includes(code as DisplayCurrencyCode);
}
