"use server";

import { sendNewMessageEmailNotice } from "@/lib/email/notify-message-email";
import { createClient } from "@/lib/supabase/server";

export type ContactSellerResult = { ok: true } | { ok: false; error: string };

export async function sendContactSellerMessage(
  productId: string,
  sellerId: string,
  body: string
): Promise<ContactSellerResult> {
  const trimmed = body.trim();
  if (!productId || !sellerId || !trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Server configuration error." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  if (sellerId === user.id) {
    return { ok: false, error: "You cannot message yourself." };
  }

  const { data: listing } = await supabase
    .from("products")
    .select("id, seller_id, title")
    .eq("id", productId)
    .maybeSingle();

  const row = listing as { id: string; seller_id: string; title: string } | null;
  if (!row || row.seller_id !== sellerId) {
    return { ok: false, error: "Listing not found." };
  }

  const { error: insertErr } = await supabase.from("messages").insert({
    product_id: productId,
    sender_id: user.id,
    recipient_id: sellerId,
    body: trimmed,
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const senderDisplayName =
    profileRow?.full_name?.trim() || user.email?.split("@")[0] || "Someone";

  void sendNewMessageEmailNotice({
    recipientUserId: sellerId,
    senderDisplayName,
    productTitle: row.title?.trim() || "your listing",
    previewSnippet: trimmed,
    threadPath: `/messages/${productId}/${user.id}`,
  });

  return { ok: true };
}
