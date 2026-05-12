import "server-only";

import { cookies } from "next/headers";
import {
  DEFAULT_DISPLAY_CURRENCY,
  DISPLAY_CURRENCY_CODES,
  fractionDigitsForCurrency,
  type DisplayCurrencyCode,
} from "@/lib/currencies";
import { getUsdExchangeRates } from "@/lib/exchange-rates";

const COOKIE_NAME = "display_currency";

export async function getDisplayCurrency(): Promise<DisplayCurrencyCode> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value?.toUpperCase();
  if (raw && DISPLAY_CURRENCY_CODES.includes(raw as DisplayCurrencyCode)) {
    return raw as DisplayCurrencyCode;
  }
  return DEFAULT_DISPLAY_CURRENCY;
}

export function convertUsdTo(
  usd: number,
  target: DisplayCurrencyCode,
  rates: Record<string, number>
): { amount: number; currency: DisplayCurrencyCode } {
  if (target === "USD") {
    return { amount: usd, currency: "USD" };
  }
  const r = rates[target];
  if (r === undefined || Number.isNaN(r)) {
    return { amount: usd, currency: "USD" };
  }
  return { amount: usd * r, currency: target };
}

export function formatUsdAsDisplay(
  usd: number,
  target: DisplayCurrencyCode,
  rates: Record<string, number>
): string {
  const { amount, currency } = convertUsdTo(usd, target, rates);
  const digits = fractionDigitsForCurrency(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export async function getListingPriceFormatter() {
  const [currency, rates] = await Promise.all([
    getDisplayCurrency(),
    getUsdExchangeRates(),
  ]);

  const conversionAvailable =
    currency === "USD" || rates[currency] !== undefined;

  return {
    currency,
    rates,
    formatUsd: (usd: number) => formatUsdAsDisplay(usd, currency, rates),
    showStoredUsdHint: currency !== "USD" && conversionAvailable,
  };
}
