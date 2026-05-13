import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConversationReplyForm } from "@/components/ConversationReplyForm";
import { MarkConversationSeen } from "@/components/MarkConversationSeen";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { fetchConversationThread } from "@/lib/data/messages";
import { fetchProductById } from "@/lib/data/products";
import { createClient } from "@/lib/supabase/server";
import { getProductImagePublicUrl } from "@/lib/supabase/public-url";
import { getListingPriceFormatter } from "@/lib/display-currency";
import { formatPrice } from "@/lib/format";
import { SetupBanner } from "@/components/SetupBanner";

type Props = { params: Promise<{ productId: string; peerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const { product } = await fetchProductById(productId);
  const title = product?.title
    ? `Messages · ${product.title.slice(0, 48)}${product.title.length > 48 ? "…" : ""}`
    : "Conversation · ReListed";
  return { title };
}

export default async function MessageThreadPage({ params }: Props) {
  const { productId, peerId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/messages/${productId}/${peerId}`);
  }

  if (peerId === user.id) {
    notFound();
  }

  const { messages, error } = await fetchConversationThread(
    user.id,
    productId,
    peerId
  );

  if (error && error !== "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">Could not load conversation: {error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    notFound();
  }

  const listingTitle = messages[0].products?.title ?? "Listing";
  const peerProfile =
    messages.find((m) => m.sender_id === peerId)?.sender ??
    messages.find((m) => m.recipient_id === peerId)?.recipient ??
    null;
  const peerLabel =
    peerProfile?.full_name?.trim() || peerLabelForThread(messages, user.id, peerId);
  const peerAvatarUrl =
    typeof peerProfile?.avatar_url === "string"
      ? peerProfile.avatar_url.trim() || null
      : null;

  const imgs = [...(messages[0].products?.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const thumbPath = imgs[0]?.storage_path;
  const thumbUrl = thumbPath ? getProductImagePublicUrl(thumbPath) : null;

  const { formatUsd, showStoredUsdHint } = await getListingPriceFormatter();
  const { product: listingMeta } = await fetchProductById(productId);
  const priceLabel = listingMeta ? formatUsd(Number(listingMeta.price)) : null;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col border-b border-border bg-[linear-gradient(180deg,#fff_0%,#f7f8fb_100%)] pb-10 pt-6">
      <MarkConversationSeen productId={productId} peerId={peerId} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/messages" className="transition hover:text-primary">
            Messages
          </Link>
          <span aria-hidden>/</span>
          <span className="max-w-[12rem] truncate font-medium text-foreground sm:max-w-md">
            {listingTitle}
          </span>
        </nav>

        <div className="grid flex-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-stretch">
          {/* Sidebar — listing + participant (marketplace-style context rail) */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="relative aspect-[4/3] bg-background">
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    No listing photo
                  </div>
                )}
              </div>
              <div className="border-t border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  About this listing
                </p>
                <p className="mt-1 line-clamp-3 text-sm font-semibold leading-snug text-foreground">
                  {listingTitle}
                </p>
                {priceLabel && (
                  <p className="mt-2 text-lg font-bold tracking-tight text-foreground">
                    {priceLabel}
                  </p>
                )}
                {showStoredUsdHint && listingMeta && (
                  <p className="mt-1 text-[11px] text-muted">
                    Listed as {formatPrice(Number(listingMeta.price))}
                  </p>
                )}
                <Link
                  href={`/listing/${productId}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                >
                  View listing
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Messaging with
              </p>
              <Link
                href={`/seller/${peerId}`}
                className="mt-3 flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-primary/20 hover:bg-primary-subtle/35"
              >
                <AvatarOrInitials
                  src={peerAvatarUrl}
                  label={peerLabel}
                  sizeClass="size-11"
                  tone="accent"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{peerLabel}</p>
                  {peerProfile?.location && (
                    <p className="truncate text-xs text-muted">{peerProfile.location}</p>
                  )}
                  <p className="mt-1 text-xs font-semibold text-primary">View profile →</p>
                </div>
              </Link>
            </div>
          </aside>

          {/* Chat column */}
          <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:min-h-[calc(100vh-10rem)]">
            <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5">
              <AvatarOrInitials
                src={peerAvatarUrl}
                label={peerLabel}
                sizeClass="size-10"
                tone="neutral"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{peerLabel}</p>
                <p className="truncate text-xs text-muted">
                  Regarding:{" "}
                  <Link
                    href={`/listing/${productId}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {listingTitle}
                  </Link>
                </p>
              </div>
            </header>

            <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,#fafbfd_0%,#f4f5f8_100%)]">
              <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-5 sm:px-5">
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  const senderName =
                    m.sender?.full_name?.trim() ||
                    (mine ? "You" : peerLabel);
                  return (
                    <li
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[min(92%,28rem)] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          mine
                            ? "rounded-br-md bg-primary text-white"
                            : "rounded-bl-md border border-border bg-surface text-foreground"
                        }`}
                      >
                        {!mine && (
                          <Link
                            href={`/seller/${peerId}`}
                            className="text-[11px] font-semibold uppercase tracking-wide text-primary hover:underline"
                          >
                            {senderName}
                          </Link>
                        )}
                        {mine && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">
                            You
                          </p>
                        )}
                        <p className={`mt-1 whitespace-pre-wrap leading-relaxed ${mine ? "" : ""}`}>
                          {m.body}
                        </p>
                        <time
                          className={`mt-2 block text-[10px] tabular-nums ${mine ? "opacity-80" : "text-muted"}`}
                          dateTime={m.created_at}
                        >
                          {new Date(m.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <ConversationReplyForm
                productId={productId}
                peerId={peerId}
                variant="embedded"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function AvatarOrInitials({
  src,
  label: _label,
  sizeClass,
  tone,
}: {
  src: string | null;
  label: string;
  sizeClass: string;
  tone: "accent" | "neutral";
}) {
  const toneCls =
    tone === "neutral"
      ? "bg-background ring-border"
      : "bg-primary-subtle ring-primary/15";
  const sizes =
    sizeClass === "size-11" ? "44px" : sizeClass === "size-10" ? "40px" : "40px";
  return (
    <ProfileAvatar
      src={src}
      alt=""
      sizes={sizes}
      className={`${sizeClass} ring-1 ${toneCls}`}
    />
  );
}

function peerLabelForThread(
  messages: {
    sender_id: string;
    recipient_id: string;
    sender: { full_name: string | null } | null;
    recipient: { full_name: string | null } | null;
  }[],
  userId: string,
  peerId: string
): string {
  const row = messages.find(
    (m) => m.sender_id === peerId || m.recipient_id === peerId
  );
  if (!row) return "Member";
  const profile = row.sender_id === peerId ? row.sender : row.recipient;
  return profile?.full_name?.trim() || "Member";
}
