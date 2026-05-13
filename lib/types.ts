import type { CategoryValue, ConditionValue } from "@/lib/constants";

export type ProductImage = {
  id: string;
  storage_path: string;
  sort_order: number;
};

export type ProfilePreview = {
  full_name: string | null;
  location: string | null;
  avatar_url?: string | null;
  telegram?: string | null;
  phone?: string | null;
};

export type ProductWithRelations = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: CategoryValue | string;
  condition: ConditionValue | string;
  /** Meet-up / pickup area; UI falls back to seller profile location when empty */
  location?: string | null;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[] | null;
  profiles: ProfilePreview | null;
};

export type MessageWithProduct = {
  id: string;
  body: string;
  created_at: string;
  product_id: string | null;
  sender_id: string;
  recipient_id: string;
  products: {
    title: string;
    product_images?: { storage_path: string; sort_order: number }[] | null;
  } | null;
  sender: ProfilePreview | null;
};

/** Row with both ends of a conversation (for inbox + threads). */
export type MessageThreadRow = MessageWithProduct & {
  recipient: ProfilePreview | null;
};

export type ConversationSummary = {
  productId: string;
  peerId: string;
  productTitle: string | null;
  /** Display name for the other person */
  peerLabel: string;
  lastBody: string;
  lastAt: string;
  /** First listing image for inbox thumbnails */
  productThumbUrl: string | null;
  /** Messages from peer not yet “seen” in inbox */
  unreadCount: number;
  /** Peer profile photo if set */
  peerAvatarUrl: string | null;
};
