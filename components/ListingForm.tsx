"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const MAX_FILES = 5;
const MAX_MB = 5;

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  productId?: string;
  initial?: {
    title: string;
    description: string;
    price: string;
    category: string;
    condition: string;
    images: { id: string; storage_path: string; sort_order: number }[];
  };
};

export function ListingForm({ mode, productId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [condition, setCondition] = useState(initial?.condition ?? "used");
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState(initial?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const remainingSlots = Math.max(0, MAX_FILES - existingImages.length);

  async function removeExisting(path: string, id: string) {
    const supabase = createClient();
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageErr) {
      setError(storageErr.message);
      return;
    }
    const { error: delErr } = await supabase.from("product_images").delete().eq("id", id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setExistingImages((prev) => prev.filter((i) => i.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }

      const priceNum = Number(price);
      if (!title.trim() || !description.trim() || Number.isNaN(priceNum) || priceNum < 0) {
        setError("Please fill all fields with a valid price.");
        setLoading(false);
        return;
      }

      let pid = productId;

      if (mode === "create") {
        const { data: inserted, error: insertErr } = await supabase
          .from("products")
          .insert({
            seller_id: user.id,
            title: title.trim(),
            description: description.trim(),
            price: priceNum,
            category,
            condition,
          })
          .select("id")
          .single();

        if (insertErr || !inserted) {
          setError(insertErr?.message ?? "Could not create listing.");
          setLoading(false);
          return;
        }
        pid = inserted.id;
      } else if (mode === "edit" && productId) {
        const { error: updErr } = await supabase
          .from("products")
          .update({
            title: title.trim(),
            description: description.trim(),
            price: priceNum,
            category,
            condition,
          })
          .eq("id", productId)
          .eq("seller_id", user.id);

        if (updErr) {
          setError(updErr.message);
          setLoading(false);
          return;
        }
        pid = productId;
      }

      if (!pid) {
        setError("Missing product id.");
        setLoading(false);
        return;
      }

      const toUpload = files.slice(0, remainingSlots);
      const sortBase = existingImages.length;
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(`Each image must be under ${MAX_MB}MB.`);
          setLoading(false);
          return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
        const path = `${user.id}/${pid}/${Date.now()}-${i}.${safeExt}`;

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) {
          setError(upErr.message);
          setLoading(false);
          return;
        }

        const { error: imgErr } = await supabase.from("product_images").insert({
          product_id: pid,
          storage_path: path,
          sort_order: sortBase + i,
        });
        if (imgErr) {
          setError(imgErr.message);
          setLoading(false);
          return;
        }
      }

      router.push(`/listing/${pid}`);
      router.refresh();
    } catch {
      setError("Unexpected error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-xl space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted">Description</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted">Price (USD)</label>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <p className="mt-1 text-[11px] text-muted">
          Amounts are saved in US dollars. Buyers can view other currencies using the site
          header.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-muted">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted">
          Photos (up to {MAX_FILES} total, {MAX_MB}MB each)
        </label>
        {existingImages.length > 0 && (
          <ul className="mt-2 space-y-2">
            {existingImages.map((img) => (
              <li
                key={img.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted"
              >
                <span className="truncate">{img.storage_path}</span>
                <button
                  type="button"
                  onClick={() => void removeExisting(img.storage_path, img.id)}
                  className="shrink-0 text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm hover:file:bg-primary-hover"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files) : [];
            setFiles(list.slice(0, remainingSlots));
          }}
        />
        <p className="mt-1 text-xs text-muted">
          {remainingSlots === 0
            ? "Maximum photos reached. Remove one to add more."
            : `You can add ${remainingSlots} more.`}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || (mode === "edit" && !productId)}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
      </button>
    </form>
  );
}
