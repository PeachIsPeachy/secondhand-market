import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { fetchProductById } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { SetupBanner } from "@/components/SetupBanner";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await fetchProductById(id);
  return {
    title: product ? `Edit ${product.title} | ReListed` : "Edit listing | ReListed",
  };
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/sell/${id}/edit`);
  }

  const { product, error } = await fetchProductById(id);

  if (error && error !== "missing_env") {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">Could not load listing.</p>
      </div>
    );
  }

  if (!product || product.seller_id !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit listing</h1>
      <p className="mt-2 text-sm text-muted">Update details or swap photos.</p>
      <div className="mt-8">
        <ListingForm
          mode="edit"
          productId={product.id}
          profileDefaultLocation={null}
          initial={{
            title: product.title,
            description: product.description,
            price: String(product.price),
            category: String(product.category),
            condition: String(product.condition),
            images: product.product_images ?? [],
            location: product.location ?? null,
          }}
        />
      </div>
    </div>
  );
}
