import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductGrid";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { SetupBanner } from "@/components/SetupBanner";
import { fetchProductsForSeller } from "@/lib/data/products";
import { displayKhLocation } from "@/lib/data/cambodia-locations";
import { telegramPublicUrl } from "@/lib/messaging/display";
import { humanizeSupabaseSchemaError } from "@/lib/supabase/schema-errors";
import { createClient } from "@/lib/supabase/server";
import { getListingPriceFormatter } from "@/lib/display-currency";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) {
    return { title: "Seller | ReListed" };
  }
  const supabase = await createClient();
  if (!supabase) return { title: "Seller | ReListed" };
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const name = data?.full_name?.trim() || "Seller";
  return { title: `${name} · Shop | ReListed` };
}

export default async function SellerProfilePage({ params }: Props) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) {
    notFound();
  }

  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const [{ data: profile, error: profileErr }, { products, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, location, avatar_url, telegram, phone")
      .eq("id", userId)
      .maybeSingle(),
    fetchProductsForSeller(userId),
  ]);

  if (error === "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const setupErr =
    (error && error !== "missing_env" ? error : null) ??
    (profileErr?.message ? humanizeSupabaseSchemaError(profileErr.message) : null);
  if (setupErr) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {setupErr}
        </div>
      </div>
    );
  }

  if (!profile && products.length === 0) {
    notFound();
  }

  const displayName = profile?.full_name?.trim() || "Seller";
  const telegramHref = telegramPublicUrl(profile?.telegram);
  const phoneRaw = profile?.phone?.trim() || "";
  const telHref = phoneRaw ? `tel:${phoneRaw.replace(/[^\d+]/g, "")}` : null;

  const { formatUsd } = await getListingPriceFormatter();

  const sessionUser = (await supabase.auth.getUser()).data.user;

  return (
    <div className="border-b border-border bg-[linear-gradient(180deg,#fff_0%,#f7f8fb_100%)] pb-12 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">Seller</span>
        </nav>

        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
            <ProfileAvatar
              src={profile?.avatar_url}
              alt=""
              sizes="96px"
              priority
              className="size-24 ring-4 ring-primary-subtle/80 shadow-md shadow-foreground/10 bg-background"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Verified seller profile
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {displayName}
              </h1>
              {profile?.location && (
                <p className="mt-1 text-sm text-muted">{displayKhLocation(profile.location)}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  {products.length} listing{products.length === 1 ? "" : "s"}
                </span>
                {telegramHref && (
                  <a
                    href={telegramHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/35 hover:bg-primary-subtle/40"
                  >
                    Telegram
                  </a>
                )}
                {telHref && (
                  <a
                    href={telHref}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:border-primary/35"
                  >
                    Call
                  </a>
                )}
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                Message this seller securely through ReListed using{" "}
                <span className="font-medium text-foreground">Contact seller</span> on any listing.
              </p>
            </div>
          </div>

          {sessionUser?.id === userId && (
            <Link
              href="/profile"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary-subtle/40"
            >
              Edit your profile
            </Link>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Listings</h2>
          <div className="mt-4">
            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center text-sm text-muted shadow-sm">
                No active listings from this seller yet.
              </div>
            ) : (
              <ProductGrid products={products} formatListingPrice={formatUsd} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
