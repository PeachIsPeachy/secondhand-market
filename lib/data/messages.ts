import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ConversationSummary, MessageThreadRow } from "@/lib/types";

function peerLabelForRow(
  row: MessageThreadRow,
  userId: string
): { peerId: string; label: string } {
  const peerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
  const peerProfile =
    row.sender_id === userId ? row.recipient : row.sender;
  const label =
    peerProfile?.full_name?.trim() ||
    (row.sender_id === userId ? "Recipient" : "Sender");
  return { peerId, label };
}

/** All messages where the user is sender or recipient (with product + profiles). */
export async function fetchAllMessagesForUser(userId: string): Promise<{
  messages: MessageThreadRow[];
  error: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { messages: [], error: "missing_env" };
  }

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      body,
      created_at,
      product_id,
      sender_id,
      recipient_id,
      products ( title ),
      sender:profiles!sender_id ( full_name, location ),
      recipient:profiles!recipient_id ( full_name, location )
    `
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { messages: [], error: error.message };
  }

  const messages = ((data ?? []) as unknown as MessageThreadRow[]).filter(
    (m) => m.product_id != null
  );
  return { messages, error: null };
}

export function buildConversationSummaries(
  rows: MessageThreadRow[],
  userId: string
): ConversationSummary[] {
  const byKey = new Map<string, ConversationSummary>();

  for (const row of rows) {
    if (!row.product_id) continue;
    const { peerId, label } = peerLabelForRow(row, userId);
    const key = `${row.product_id}:${peerId}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        productId: row.product_id,
        peerId,
        productTitle: row.products?.title ?? null,
        peerLabel: label,
        lastBody: row.body,
        lastAt: row.created_at,
      });
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
}

export async function fetchConversationThread(
  userId: string,
  productId: string,
  peerId: string
): Promise<{ messages: MessageThreadRow[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { messages: [], error: "missing_env" };
  }

  const pairOr = `and(sender_id.eq.${userId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${userId})`;

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      body,
      created_at,
      product_id,
      sender_id,
      recipient_id,
      products ( title ),
      sender:profiles!sender_id ( full_name, location ),
      recipient:profiles!recipient_id ( full_name, location )
    `
    )
    .eq("product_id", productId)
    .or(pairOr)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [], error: error.message };
  }

  const messages = (data ?? []) as unknown as MessageThreadRow[];
  return { messages, error: null };
}
