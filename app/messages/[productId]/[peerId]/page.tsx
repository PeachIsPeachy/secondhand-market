import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConversationReplyForm } from "@/components/ConversationReplyForm";
import { fetchConversationThread } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";
import { SetupBanner } from "@/components/SetupBanner";

type Props = { params: Promise<{ productId: string; peerId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Conversation · ReListed" };
}

export default async function MessageThreadPage({ params }: Props) {
  const { productId, peerId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">Could not load conversation: {error}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    notFound();
  }

  const title =
    messages[0].products?.title ?? "Listing";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/messages"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← All messages
      </Link>
      <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted">
        With{" "}
        <span className="font-semibold text-foreground">
          {peerLabelForThread(messages, user.id, peerId)}
        </span>
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <li
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[min(100%,28rem)] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-md bg-primary text-white"
                    : "rounded-bl-md border border-border bg-background text-foreground"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  {mine ? "You" : m.sender?.full_name?.trim() || "Member"}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <time
                  className={`mt-2 block text-[10px] opacity-70`}
                  dateTime={m.created_at}
                >
                  {new Date(m.created_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            </li>
          );
        })}
      </ul>

      <ConversationReplyForm productId={productId} peerId={peerId} />
    </div>
  );
}

function peerLabelForThread(
  messages: { sender_id: string; recipient_id: string; sender: { full_name: string | null } | null; recipient: { full_name: string | null } | null }[],
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
