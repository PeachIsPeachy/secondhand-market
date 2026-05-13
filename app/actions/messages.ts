"use server";

import { sendNewMessageEmailNotice } from "@/lib/email/notify-message-email";
import { createClient } from "@/lib/supabase/server";

export type SendThreadReplyResult = { ok: true } | { ok: false; error: string };

export async function markConversationSeen(
  productId: string,
  peerId: string
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || peerId === user.id || !productId) {
    return;
  }

  await supabase.from("conversation_seen").upsert(
    {
      viewer_id: user.id,
      product_id: productId,
      peer_id: peerId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "viewer_id,product_id,peer_id" }
  );
}

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

  const [{ data: profileRow }, { data: productRow }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("products").select("title").eq("id", productId).maybeSingle(),
  ]);

  const senderDisplayName =
    profileRow?.full_name?.trim() || user.email?.split("@")[0] || "Someone";
  const productTitle =
    (productRow as { title?: string } | null)?.title?.trim() || "your listing";

  void sendNewMessageEmailNotice({
    recipientUserId: peerId,
    senderDisplayName,
    productTitle,
    previewSnippet: body,
    threadPath: `/messages/${productId}/${user.id}`,
  });

  return { ok: true };
}
