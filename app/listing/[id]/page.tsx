import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactSeller } from "@/components/ContactSeller";
import { ListingImageGallery } from "@/components/ListingImageGallery";
import { fetchProductById } from "@/lib/data/products";
import { getListingPriceFormatter } from "@/lib/display-currency";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel, conditionLabel, formatPrice } from "@/lib/format";
import { getProductImagePublicUrl } from "@/lib/supabase/public-url";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SetupBanner } from "@/components/SetupBanner";
import { displayKhLocation } from "@/lib/data/cambodia-locations";
import { listingLocationLine } from "@/lib/display/listing-location";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product, error } = await fetchProductById(id);
  if (error === "missing_env" || !product) {
    return { title: "Listing | ReListed" };
  }
  const desc = product.description.slice(0, 155);
  const title = `${product.title} | ReListed`;
  const first = product.product_images?.[0];
  const imageUrl = first
    ? getProductImagePublicUrl(first.storage_path)
    : undefined;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const { product, error } = await fetchProductById(id);

  if (error === "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const images = product.product_images ?? [];
  const seller = product.profiles;
  const { formatUsd, showStoredUsdHint } = await getListingPriceFormatter();

  const galleryImages = images.map((img) => ({
    id: img.id,
    src: getProductImagePublicUrl(img.storage_path),
  }));
  const sizesGrid =
    images.length === 1
      ? "(max-width: 1024px) 100vw, 720px"
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px";
  const listingLocLine = listingLocationLine(product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-3">
          {images.length === 0 ? (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-background text-sm text-muted">
              No photos for this listing
            </div>
          ) : (
            <ListingImageGallery images={galleryImages} sizesGrid={sizesGrid} />
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {categoryLabel(String(product.category))}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              {product.title}
            </h1>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {formatUsd(Number(product.price))}
            </p>
            {showStoredUsdHint && (
              <p className="mt-1 text-xs text-muted">
                Listed as {formatPrice(Number(product.price))} · converted with daily rates
                (indicative only)
              </p>
            )}
            <p className="mt-2 text-sm text-muted">
              {conditionLabel(String(product.condition))}
              {listingLocLine ? <> · {listingLocLine}</> : null}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-primary-subtle/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Seller
            </p>
            <Link
              href={`/seller/${product.seller_id}`}
              className="group mt-3 flex items-start gap-3 rounded-xl p-1 outline-none transition hover:bg-primary-subtle/60 focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <ProfileAvatar
                src={seller?.avatar_url}
                alt=""
                sizes="48px"
                className="size-12 bg-background ring-1 ring-border"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                  {seller?.full_name?.trim() || "Private seller"}
                </p>
                {seller?.location ? (
                  <p className="text-sm text-muted">
                    {displayKhLocation(seller.location)}
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-primary">View seller profile →</p>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          </div>

          <ContactSeller
            productId={product.id}
            sellerId={product.seller_id}
            currentUserId={user?.id ?? null}
          />

          {user?.id === product.seller_id && (
            <Link
              href={`/sell/${product.id}/edit`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary-subtle/30 sm:w-auto sm:px-6"
            >
              Edit listing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
