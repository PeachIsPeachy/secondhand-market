import { ProductCard } from "@/components/ProductCard";
import type { ProductWithRelations } from "@/lib/types";

type Props = {
  products: ProductWithRelations[];
  formatListingPrice?: (usd: number) => string;
};

export function ProductGrid({ products, formatListingPrice }: Props) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center shadow-sm">
        <p className="text-lg font-semibold text-foreground">No listings match your filters</p>
        <p className="mt-2 max-w-md text-sm text-muted">
          Try clearing search or broadening price and category filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          priceLabel={
            formatListingPrice
              ? formatListingPrice(Number(p.price))
              : undefined
          }
        />
      ))}
    </div>
  );
}
