import { Suspense } from "react";
import type { Metadata } from "next";
import { FiltersPanel } from "@/components/FiltersPanel";
import { ProductGrid } from "@/components/ProductGrid";
import { SetupBanner } from "@/components/SetupBanner";
import { fetchProducts } from "@/lib/data/products";
import { getListingPriceFormatter } from "@/lib/display-currency";
import { SORT_OPTIONS, type SortValue } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Search results | ReListed",
  description: "Filter and sort second-hand listings on ReListed.",
};

function isSort(v: string | undefined): v is SortValue {
  return !!v && SORT_OPTIONS.some((s) => s.value === v);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const condition = typeof sp.condition === "string" ? sp.condition : undefined;
  const minPrice = typeof sp.min === "string" ? sp.min : undefined;
  const maxPrice = typeof sp.max === "string" ? sp.max : undefined;
  const sortParam = typeof sp.sort === "string" ? sp.sort : undefined;
  const sort = isSort(sortParam) ? sortParam : undefined;

  const { products, error } = await fetchProducts({
    q,
    category,
    condition,
    minPrice,
    maxPrice,
    sort,
  });

  if (error === "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Search failed: {error}
        </div>
      </div>
    );
  }

  const { formatUsd } = await getListingPriceFormatter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="lg:w-72 lg:shrink-0">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-2xl bg-border/60" aria-hidden />
            }
          >
            <FiltersPanel basePath="/search" />
          </Suspense>
        </aside>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Search results
            </h1>
            <p className="mt-1 text-sm text-muted">
              {products.length} {products.length === 1 ? "match" : "matches"}
              {q ? ` for “${q}”` : ""}
            </p>
          </div>
          <ProductGrid products={products} formatListingPrice={formatUsd} />
        </div>
      </div>
    </div>
  );
}
