import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductWithRelations } from "@/lib/types";
import { getProductImagePublicUrl } from "@/lib/supabase/public-url";
import { listingLocationLine } from "@/lib/display/listing-location";
import { DeleteListingButton } from "@/components/DeleteListingButton";

export function ProfileListingRow({
  product,
  priceLabel,
}: {
  product: ProductWithRelations;
  priceLabel?: string;
}) {
  const img = product.product_images?.[0];
  const src = img ? getProductImagePublicUrl(img.storage_path) : null;
  const meetLine = listingLocationLine(product);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center">
      <Link
        href={`/listing/${product.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-background sm:h-24 sm:w-36 sm:shrink-0 sm:aspect-auto"
      >
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 144px"
            quality={85}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted">
            No photo
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/listing/${product.id}`}
          className="font-semibold text-foreground hover:text-primary hover:underline"
        >
          {product.title}
        </Link>
        <p className="text-sm font-medium text-foreground">
          {priceLabel ?? formatPrice(Number(product.price))}
        </p>
        {meetLine ? <p className="text-xs text-muted">{meetLine}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <Link
          href={`/sell/${product.id}/edit`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Edit
        </Link>
        <DeleteListingButton productId={product.id} />
      </div>
    </li>
  );
}
