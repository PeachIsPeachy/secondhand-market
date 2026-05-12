import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildConversationSummaries,
  fetchAllMessagesForUser,
} from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";
import { SetupBanner } from "@/components/SetupBanner";

export const metadata: Metadata = {
  title: "Messages | ReListed",
  description: "Conversations with buyers and sellers.",
};

export default async function MessagesPage() {
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
    redirect("/login?next=/messages");
  }

  const { messages, error } = await fetchAllMessagesForUser(user.id);

  if (error && error !== "missing_env") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">Could not load messages: {error}</p>
      </div>
    );
  }

  const conversations = buildConversationSummaries(messages, user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Messages
      </h1>
      <p className="mt-1 text-sm text-muted">
        Open a thread to read the full conversation and reply. Buyers reach you from “Contact
        seller” on a listing.
      </p>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted shadow-sm">
          No conversations yet. When someone contacts you—or you message a seller—it will show up
          here.
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {conversations.map((c) => (
            <li key={`${c.productId}:${c.peerId}`}>
              <Link
                href={`/messages/${c.productId}/${c.peerId}`}
                className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span className="font-semibold text-foreground">{c.peerLabel}</span>
                  <time dateTime={c.lastAt}>
                    {new Date(c.lastAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
                {c.productTitle && (
                  <p className="mt-1 text-sm font-medium text-primary">{c.productTitle}</p>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-muted">{c.lastBody}</p>
                <p className="mt-2 text-xs font-medium text-primary">Open thread →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
