import "server-only";

/** USD → target: multiply stored USD by rate. Frankfurter returns rates as “how many units per 1 USD”. */
export async function getUsdExchangeRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { rates?: Record<string, number> };
    return data.rates ?? {};
  } catch {
    return {};
  }
}
