import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { fetchInboxForUser } from "@/lib/data/messages";
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
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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

  const { summaries, error } = await fetchInboxForUser(user.id);

  if (error && error !== "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">Could not load messages: {error}</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-[linear-gradient(180deg,#fff_0%,#f7f8fb_100%)] pb-12 pt-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">Messages</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Messages
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Conversations about your listings and purchases—similar to buyer–seller messaging on
              major marketplaces.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary-subtle/40"
          >
            Browse listings
          </Link>
        </div>

        {summaries.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-subtle text-2xl">
              💬
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">No conversations yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              When you contact a seller from a listing—or a buyer messages you about your item—it
              will appear here with unread badges when applicable.
            </p>
            <Link
              href="/categories"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Explore categories
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {summaries.map((c) => (
              <li key={`${c.productId}:${c.peerId}`}>
                <Link
                  href={`/messages/${c.productId}/${c.peerId}`}
                  className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm ring-1 ring-transparent transition hover:border-primary/25 hover:shadow-md hover:ring-primary/10 sm:p-5"
                >
                  <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-background ring-1 ring-border">
                    {c.productThumbUrl ? (
                      <Image
                        src={c.productThumbUrl}
                        alt=""
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        sizes="72px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-muted">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <ProfileAvatar
                          src={c.peerAvatarUrl}
                          alt=""
                          sizes="36px"
                          className="size-9 ring-1 ring-primary/15 bg-primary-subtle"
                        />
                        <span className="truncate font-semibold text-foreground">{c.peerLabel}</span>
                        {c.unreadCount > 0 && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                            {c.unreadCount > 99 ? "99+" : c.unreadCount}
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={c.lastAt}
                        className="shrink-0 text-xs text-muted tabular-nums"
                      >
                        {formatRelativeTime(c.lastAt)}
                      </time>
                    </div>
                    {c.productTitle && (
                      <p className="mt-1 truncate text-sm font-medium text-primary">
                        Re: {c.productTitle}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {c.lastBody}
                    </p>
                  </div>
                  <div className="hidden shrink-0 self-center text-muted sm:block">
                    <span className="text-lg transition group-hover:translate-x-0.5 group-hover:text-primary">
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
