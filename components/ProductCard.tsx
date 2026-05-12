import Image from "next/image";
import Link from "next/link";
import { formatPrice, conditionLabel, categoryLabel } from "@/lib/format";
import type { ProductWithRelations } from "@/lib/types";
import { getProductImagePublicUrl } from "@/lib/supabase/public-url";

export function ProductCard({
  product,
  priceLabel,
}: {
  product: ProductWithRelations;
  priceLabel?: string;
}) {
  const img = product.product_images?.[0];
  const src = img ? getProductImagePublicUrl(img.storage_path) : null;

  return (
    <Link
      href={`/listing/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-px hover:border-primary/25 hover:shadow-md hover:ring-primary/10"
    >
      <div className="relative aspect-[4/3] bg-background">
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            quality={88}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
          {categoryLabel(String(product.category))}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.title}
        </p>
        <p className="text-lg font-bold tracking-tight text-foreground">
          {priceLabel ?? formatPrice(Number(product.price))}
        </p>
        <p className="text-xs text-muted">{conditionLabel(String(product.condition))}</p>
      </div>
    </Link>
  );
}
