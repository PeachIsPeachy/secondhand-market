import type { ProductWithRelations } from "@/lib/types";
import { displayKhLocation } from "@/lib/data/cambodia-locations";

/** Prefer listing-specific location; otherwise seller profile location. */
export function listingLocationLine(product: ProductWithRelations): string {
  const raw =
    typeof product.location === "string" && product.location.trim()
      ? product.location.trim()
      : typeof product.profiles?.location === "string" && product.profiles.location.trim()
        ? product.profiles!.location!.trim()
        : "";
  return raw ? displayKhLocation(raw) : "";
}
