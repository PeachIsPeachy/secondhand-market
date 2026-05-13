import "server-only";

import type { ConversationSummary, MessageThreadRow } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/supabase/public-url";
import { humanizeSupabaseSchemaError } from "@/lib/supabase/schema-errors";

const PRODUCT_EMBED = `products (
        title,
        product_images ( storage_path, sort_order )
      )`;

function peerMetaForRow(
  row: MessageThreadRow,
  userId: string
): { peerId: string; label: string; avatarUrl: string | null } {
  const peerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
  const peerProfile =
    row.sender_id === userId ? row.recipient : row.sender;
  const label =
    peerProfile?.full_name?.trim() ||
    (row.sender_id === userId ? "Recipient" : "Sender");
  const avatarUrl =
    typeof peerProfile?.avatar_url === "string"
      ? peerProfile.avatar_url.trim() || null
      : null;
  return { peerId, label, avatarUrl };
}

export async function fetchConversationSeenForViewer(
  viewerId: string
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const map = new Map<string, number>();
  if (!supabase) {
    return map;
  }

  const { data, error } = await supabase
    .from("conversation_seen")
    .select("product_id, peer_id, last_seen_at")
    .eq("viewer_id", viewerId);

  if (error || !data) {
    return map;
  }

  for (const row of data as {
    product_id: string;
    peer_id: string;
    last_seen_at: string;
  }[]) {
    map.set(
      `${row.product_id}:${row.peer_id}`,
      new Date(row.last_seen_at).getTime()
    );
  }
  return map;
}

/** Lightweight unread total for navbar badge (requires conversation_seen migration). */
export async function fetchUnreadInboundTotal(userId: string): Promise<number> {
  const supabase = await createClient();
  if (!supabase) {
    return 0;
  }

  const [{ data: inbound, error: inboundErr }, seenMap] = await Promise.all([
    supabase
      .from("messages")
      .select("product_id, sender_id, created_at")
      .eq("recipient_id", userId),
    fetchConversationSeenForViewer(userId),
  ]);

  if (inboundErr || !inbound?.length) {
    return 0;
  }

  let n = 0;
  for (const row of inbound as {
    product_id: string | null;
    sender_id: string;
    created_at: string;
  }[]) {
    if (!row.product_id) continue;
    const ts = seenMap.get(`${row.product_id}:${row.sender_id}`) ?? 0;
    if (new Date(row.created_at).getTime() > ts) {
      n++;
    }
  }
  return n;
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
      ${PRODUCT_EMBED},
      sender:profiles!sender_id ( full_name, location, avatar_url ),
      recipient:profiles!recipient_id ( full_name, location, avatar_url )
    `
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { messages: [], error: humanizeSupabaseSchemaError(error.message) };
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
    const { peerId, label, avatarUrl } = peerMetaForRow(row, userId);
    const key = `${row.product_id}:${peerId}`;
    if (!byKey.has(key)) {
      const imgs = [...(row.products?.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const path = imgs[0]?.storage_path;
      byKey.set(key, {
        productId: row.product_id,
        peerId,
        productTitle: row.products?.title ?? null,
        peerLabel: label,
        lastBody: row.body,
        lastAt: row.created_at,
        productThumbUrl: path ? getProductImagePublicUrl(path) : null,
        unreadCount: 0,
        peerAvatarUrl: avatarUrl,
      });
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
}

export function enrichConversationSummaries(
  rows: MessageThreadRow[],
  userId: string,
  seenMap: Map<string, number>
): ConversationSummary[] {
  const summaries = buildConversationSummaries(rows, userId);

  return summaries.map((s) => {
    const seenTs = seenMap.get(`${s.productId}:${s.peerId}`) ?? 0;

    const unreadCount = rows.filter(
      (r) =>
        r.product_id === s.productId &&
        r.recipient_id === userId &&
        r.sender_id === s.peerId &&
        new Date(r.created_at).getTime() > seenTs
    ).length;

    return {
      ...s,
      unreadCount,
    };
  });
}

export async function fetchInboxForUser(userId: string): Promise<{
  summaries: ConversationSummary[];
  totalUnread: number;
  error: string | null;
}> {
  const { messages, error } = await fetchAllMessagesForUser(userId);
  if (error && error !== "missing_env") {
    return { summaries: [], totalUnread: 0, error };
  }
  const seenMap = await fetchConversationSeenForViewer(userId);
  const summaries = enrichConversationSummaries(messages, userId, seenMap);
  const totalUnread = summaries.reduce((a, s) => a + s.unreadCount, 0);
  return { summaries, totalUnread, error: null };
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
      ${PRODUCT_EMBED},
      sender:profiles!sender_id ( full_name, location, avatar_url ),
      recipient:profiles!recipient_id ( full_name, location, avatar_url )
    `
    )
    .eq("product_id", productId)
    .or(pairOr)
    .order("created_at", { ascending: true });

  if (error) {
    return { messages: [], error: humanizeSupabaseSchemaError(error.message) };
  }

  const messages = (data ?? []) as unknown as MessageThreadRow[];
  return { messages, error: null };
}
