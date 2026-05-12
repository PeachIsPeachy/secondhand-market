"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setDisplayCurrency } from "@/app/actions/currency";
import { DISPLAY_CURRENCIES, type DisplayCurrencyCode } from "@/lib/currencies";

export function CurrencySwitcher({ current }: { current: DisplayCurrencyCode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <span className="hidden whitespace-nowrap sm:inline">Prices in</span>
      <select
        value={current}
        disabled={pending}
        aria-label="Display currency"
        className="max-w-[8.5rem] truncate rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        onChange={(e) => {
          const v = e.target.value as DisplayCurrencyCode;
          startTransition(() => {
            void (async () => {
              await setDisplayCurrency(v);
              router.refresh();
            })();
          });
        }}
      >
        {DISPLAY_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
