"use client";

import { useState } from "react";
import Link from "next/link";
import { sendContactSellerMessage } from "@/app/actions/contact-seller";

type Props = {
  productId: string;
  sellerId: string;
  currentUserId?: string | null;
};

export function ContactSeller({ productId, sellerId, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const isSeller = currentUserId && currentUserId === sellerId;
  const needsAuth = !currentUserId;

  async function send() {
    setStatus("saving");
    setError(null);
    try {
      const result = await sendContactSellerMessage(productId, sellerId, body);
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setStatus("done");
      setBody("");
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div>
      {needsAuth && (
        <p className="mb-3 text-sm text-muted">
          <Link href="/login" className="font-semibold text-primary underline underline-offset-2">
            Sign in
          </Link>{" "}
          to message the seller.
        </p>
      )}
      {isSeller && <p className="text-sm text-muted">This is your listing.</p>}
      {!isSeller && currentUserId && (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setStatus("idle");
              setError(null);
            }}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Contact seller
          </button>
        </>
      )}

      {open && !isSeller && currentUserId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-foreground/10">
            <h3 className="text-lg font-semibold text-foreground">Message the seller</h3>
            <p className="mt-1 text-sm text-muted">
              They&apos;ll see this in their ReListed inbox. When email is configured (see{" "}
              <code className="rounded bg-border/60 px-1 py-0.5 text-[11px]">.env.example</code>), they
              can also get an alert in their personal email.
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-4 w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Hi — is this still available?"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {status === "done" && (
              <div className="mt-2 space-y-2 text-sm">
                <p className="font-medium text-emerald-700">Message sent.</p>
                <p>
                  <Link
                    href={`/messages/${productId}/${sellerId}`}
                    className="font-semibold text-primary underline underline-offset-2"
                  >
                    Open conversation
                  </Link>{" "}
                  to continue messaging.
                </p>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary-subtle/40 hover:text-foreground"
              >
                Close
              </button>
              <button
                type="button"
                disabled={status === "saving" || !body.trim()}
                onClick={() => void send()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {status === "saving" ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
