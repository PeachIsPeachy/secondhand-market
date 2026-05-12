"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendThreadReply } from "@/app/actions/messages";

export function ConversationReplyForm({
  productId,
  peerId,
}: {
  productId: string;
  peerId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <label htmlFor="reply-body" className="text-sm font-semibold text-foreground">
        Reply
      </label>
      <textarea
        id="reply-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Write a message…"
        className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
        <Link href={`/listing/${productId}`} className="text-sm font-medium text-primary hover:underline">
          View listing
        </Link>
      </div>
    </form>
  );
}
