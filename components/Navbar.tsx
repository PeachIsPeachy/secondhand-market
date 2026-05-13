import Image from "next/image";
import Link from "next/link";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { MessagesNavItem } from "@/components/MessagesNavItem";
import { NavbarAuth } from "@/components/NavbarAuth";
import { fetchUnreadInboundTotal } from "@/lib/data/messages";
import { getDisplayCurrency } from "@/lib/display-currency";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/sell", label: "Sell" },
  { href: "/profile", label: "Profile" },
];

export async function Navbar() {
  const [supabase, displayCurrency] = await Promise.all([
    createClient(),
    getDisplayCurrency(),
  ]);
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const unreadCount = user ? await fetchUnreadInboundTotal(user.id) : 0;

  const navMuted = "transition-colors hover:text-primary";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/92 shadow-[0_1px_0_rgba(12,12,14,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground sm:text-[1.05rem]"
        >
          <Image
            src="/relisted-mark.png"
            alt=""
            width={36}
            height={36}
            className="size-8 shrink-0 sm:size-9"
            priority
          />
          <span>
            Re<span className="text-primary">Listed</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-medium text-muted sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navMuted}>
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <MessagesNavItem initialCount={unreadCount} className={navMuted} />
              <Link href="/search" className={navMuted}>
                Search
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySwitcher current={displayCurrency} />
          <NavbarAuth user={user ? { id: user.id, email: user.email ?? null } : null} />
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border/70 bg-surface/80 px-4 py-2.5 text-xs font-medium text-muted sm:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-primary">
            {l.label}
          </Link>
        ))}
        {user && (
          <>
            <MessagesNavItem initialCount={unreadCount} className="hover:text-primary" />
            <Link href="/search" className="hover:text-primary">
              Search
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
