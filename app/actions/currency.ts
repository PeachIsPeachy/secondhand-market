"use server";

import { cookies } from "next/headers";
import { DISPLAY_CURRENCY_CODES, type DisplayCurrencyCode } from "@/lib/currencies";

export async function setDisplayCurrency(code: string) {
  const upper = code.toUpperCase();
  if (!DISPLAY_CURRENCY_CODES.includes(upper as DisplayCurrencyCode)) {
    return;
  }
  const store = await cookies();
  store.set("display_currency", upper, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });
}
