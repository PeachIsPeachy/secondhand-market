"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";

export function DeleteListingButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this listing permanently?")) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: imgs } = await supabase
      .from("product_images")
      .select("storage_path")
      .eq("product_id", productId);

    const paths = imgs?.map((r) => r.storage_path).filter(Boolean) as string[];
    if (paths?.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("seller_id", user.id);

    setLoading(false);
    if (error) {
      window.alert(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void onDelete()}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
