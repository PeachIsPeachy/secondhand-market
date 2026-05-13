import "server-only";

import { createClient } from "@/lib/supabase/server";
import { humanizeSupabaseSchemaError } from "@/lib/supabase/schema-errors";
import type { SortValue } from "@/lib/constants";
import type { ProductWithRelations } from "@/lib/types";

export type ProductQueryParams = {
  q?: string;
  category?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: SortValue;
};

function mapSort(sort: SortValue | undefined) {
  switch (sort) {
    case "price_asc":
      return { column: "price", ascending: true };
    case "price_desc":
      return { column: "price", ascending: false };
    case "newest":
    default:
      return { column: "created_at", ascending: false };
  }
}

export async function fetchProducts(
  params: ProductQueryParams
): Promise<{ products: ProductWithRelations[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { products: [], error: "missing_env" };
  }

  const { column, ascending } = mapSort(params.sort);

  let query = supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      title,
      description,
      price,
      category,
      condition,
      location,
      created_at,
      updated_at,
      product_images ( id, storage_path, sort_order ),
      profiles!seller_id ( full_name, location, avatar_url )
    `
    )
    .order(column, { ascending });

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.condition) {
    query = query.eq("condition", params.condition);
  }

  const minP = params.minPrice ? Number(params.minPrice) : null;
  const maxP = params.maxPrice ? Number(params.maxPrice) : null;
  if (minP !== null && !Number.isNaN(minP)) {
    query = query.gte("price", minP);
  }
  if (maxP !== null && !Number.isNaN(maxP)) {
    query = query.lte("price", maxP);
  }

  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    return { products: [], error: humanizeSupabaseSchemaError(error.message) };
  }

  const rows = (data ?? []) as unknown as ProductWithRelations[];

  /* Client-side tie-break for image order if nested order is flaky */
  rows.forEach((p) => {
    if (p.product_images?.length) {
      p.product_images.sort((a, b) => a.sort_order - b.sort_order);
    }
  });

  return { products: rows, error: null };
}

export async function fetchProductById(
  id: string
): Promise<{ product: ProductWithRelations | null; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { product: null, error: "missing_env" };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      title,
      description,
      price,
      category,
      condition,
      location,
      created_at,
      updated_at,
      product_images ( id, storage_path, sort_order ),
      profiles!seller_id ( full_name, location, avatar_url )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { product: null, error: humanizeSupabaseSchemaError(error.message) };
  }

  const product = data as unknown as ProductWithRelations | null;
  if (product?.product_images?.length) {
    product.product_images.sort((a, b) => a.sort_order - b.sort_order);
  }

  return { product, error: null };
}

export async function fetchMyProducts(
  userId: string
): Promise<{ products: ProductWithRelations[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { products: [], error: "missing_env" };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      title,
      description,
      price,
      category,
      condition,
      location,
      created_at,
      updated_at,
      product_images ( id, storage_path, sort_order ),
      profiles!seller_id ( full_name, location, avatar_url )
    `
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { products: [], error: humanizeSupabaseSchemaError(error.message) };
  }

  const rows = (data ?? []) as unknown as ProductWithRelations[];
  rows.forEach((p) => {
    if (p.product_images?.length) {
      p.product_images.sort((a, b) => a.sort_order - b.sort_order);
    }
  });

  return { products: rows, error: null };
}

/** Active listings for a public seller profile page */
export async function fetchProductsForSeller(
  sellerId: string
): Promise<{ products: ProductWithRelations[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { products: [], error: "missing_env" };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      seller_id,
      title,
      description,
      price,
      category,
      condition,
      location,
      created_at,
      updated_at,
      product_images ( id, storage_path, sort_order ),
      profiles!seller_id ( full_name, location, avatar_url )
    `
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { products: [], error: humanizeSupabaseSchemaError(error.message) };
  }

  const rows = (data ?? []) as unknown as ProductWithRelations[];
  rows.forEach((p) => {
    if (p.product_images?.length) {
      p.product_images.sort((a, b) => a.sort_order - b.sort_order);
    }
  });

  return { products: rows, error: null };
}
