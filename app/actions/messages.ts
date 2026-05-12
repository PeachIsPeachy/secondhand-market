"use server";

import { createClient } from "@/lib/supabase/server";

export type SendThreadReplyResult = { ok: true } | { ok: false; error: string };

export async function sendThreadReply(formData: FormData): Promise<SendThreadReplyResult> {
  const productId = String(formData.get("productId") ?? "").trim();
  const peerId = String(formData.get("peerId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!productId || !peerId || !body) {
    return { ok: false, error: "Message and recipients are required." };
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

  if (peerId === user.id) {
    return { ok: false, error: "Invalid recipient." };
  }

  const pairOr = `and(sender_id.eq.${user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user.id})`;

  const { count, error: countErr } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .or(pairOr);

  if (countErr) {
    return { ok: false, error: countErr.message };
  }
  if (!count || count < 1) {
    return { ok: false, error: "No conversation found for this listing." };
  }

  const { error: insertErr } = await supabase.from("messages").insert({
    product_id: productId,
    sender_id: user.id,
    recipient_id: peerId,
    body,
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  return { ok: true };
}
