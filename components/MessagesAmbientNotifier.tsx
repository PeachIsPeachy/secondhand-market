"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { broadcastUnreadCount } from "@/lib/client/unread-messages-bus";

/**
 * Single global poller + toast. Broadcasts counts so nav badges stay in sync without duplicate intervals.
 */
export function MessagesAmbientNotifier() {
  const prevRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/messages/unread-count", {
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { count?: number };
        const next = typeof data.count === "number" ? data.count : 0;

        broadcastUnreadCount(next);

        if (prevRef.current !== null && next > prevRef.current) {
          setToast("New message received");
          window.setTimeout(() => setToast(null), 6500);
        }
        prevRef.current = next;
      } catch {
        /* ignore */
      }
    }

    void poll();
    const interval = window.setInterval(() => void poll(), 35_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return toast ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-lg shadow-foreground/15"
    >
      <span className="text-primary">●</span> {toast}{" "}
      <Link href="/messages" className="font-semibold text-primary underline underline-offset-2">
        View inbox
      </Link>
    </div>
  ) : null;
}
