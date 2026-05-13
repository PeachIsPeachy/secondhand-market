"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendThreadReply } from "@/app/actions/messages";

export function ConversationReplyForm({
  productId,
  peerId,
  variant = "card",
}: {
  productId: string;
  peerId: string;
  variant?: "card" | "embedded";
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const embedded = variant === "embedded";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) return;

    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("peerId", peerId);
    fd.set("body", trimmed);

    startTransition(() => {
      void (async () => {
        const r = await sendThreadReply(fd);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        setBody("");
        router.refresh();
      })();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        embedded
          ? "border-t border-border bg-surface px-3 py-4 sm:px-5"
          : "mt-8 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      }
    >
      <label
        htmlFor="reply-body"
        className={`text-sm font-semibold text-foreground ${embedded ? "sr-only" : ""}`}
      >
        {embedded ? "Write a reply" : "Reply"}
      </label>
      {!embedded && (
        <p className="mt-1 text-xs text-muted">
          Messages are tied to this listing. Keep exchanges respectful and on-topic.
        </p>
      )}
      <textarea
        id="reply-body"
        aria-label={embedded ? "Your reply" : undefined}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={embedded ? 3 : 4}
        placeholder={embedded ? "Type your reply…" : "Write a message…"}
        className={`w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 ${
          embedded ? "mt-0 min-h-[88px]" : "mt-2"
        }`}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className={`flex flex-wrap items-center gap-3 ${embedded ? "mt-3" : "mt-3"}`}>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send"}
        </button>
        <Link
          href={`/listing/${productId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View listing
        </Link>
      </div>
    </form>
  );
}
