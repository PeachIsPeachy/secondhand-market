import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileListingRow } from "@/components/ProfileListingRow";
import { fetchMyProducts } from "@/lib/data/products";
import { displayKhLocation } from "@/lib/data/cambodia-locations";
import { getListingPriceFormatter } from "@/lib/display-currency";
import { telegramPublicUrl } from "@/lib/messaging/display";
import { createClient } from "@/lib/supabase/server";
import { humanizeSupabaseSchemaError } from "@/lib/supabase/schema-errors";
import { SetupBanner } from "@/components/SetupBanner";

export const metadata: Metadata = {
  title: "Your account | ReListed",
  description: "Manage your ReListed seller profile, photo, and listings.",
};

export default async function ProfilePage() {
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
    redirect("/login?next=/profile");
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, location, avatar_url, telegram, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr?.message) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {humanizeSupabaseSchemaError(profileErr.message)}
        </div>
      </div>
    );
  }

  const { products, error: productsErr } = await fetchMyProducts(user.id);
  if (productsErr && productsErr !== "missing_env") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {productsErr}
        </div>
      </div>
    );
  }
  const { formatUsd } = await getListingPriceFormatter();

  const displayName = profile?.full_name?.trim() || "Seller";
  const avatarUrl = profile?.avatar_url?.trim() ?? "";
  const telegram = profile?.telegram?.trim() ?? "";
  const phone = profile?.phone?.trim() ?? "";
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;
  const locationLine =
    profile?.location?.trim() ? displayKhLocation(profile.location) : "";
  const tgHref = telegram ? telegramPublicUrl(telegram) : null;

  return (
    <div className="border-b border-border bg-[linear-gradient(180deg,#fff_0%,#f7f8fb_100%)]">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">Profile</span>
        </nav>

        {/* Account hero — marketplace-style account header */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_50%,#e8f1fc_100%)] px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <ProfileAvatar
                  src={avatarUrl}
                  alt=""
                  sizes="112px"
                  priority
                  className="size-28 ring-4 ring-white shadow-md shadow-foreground/10 bg-background"
                />
                <div className="text-center sm:text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Seller account
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {displayName}
                  </h1>
                  <p className="mt-2 text-sm text-muted">{user.email}</p>
                  {memberSince && (
                    <p className="mt-1 text-xs text-muted">Member since {memberSince}</p>
                  )}
                  {(locationLine || phone || telegram) && (
                    <dl className="mt-4 space-y-1.5 text-left text-sm">
                      {locationLine ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          <dt className="shrink-0 text-muted">Location</dt>
                          <dd className="min-w-0 font-medium text-foreground">{locationLine}</dd>
                        </div>
                      ) : null}
                      {phone ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          <dt className="shrink-0 text-muted">Phone</dt>
                          <dd className="min-w-0">
                            <a
                              href={`tel:${phone.replace(/\s/g, "")}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {phone}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      {telegram && tgHref ? (
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          <dt className="shrink-0 text-muted">Telegram</dt>
                          <dd className="min-w-0">
                            <a
                              href={tgHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              @{telegram.replace(/^@/, "")}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                      {products.length} active listing{products.length === 1 ? "" : "s"}
                    </span>
                    <Link
                      href="/messages"
                      className="rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary-subtle/50"
                    >
                      Messages
                    </Link>
                    <Link
                      href={`/seller/${user.id}`}
                      className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                    >
                      View public shop
                    </Link>
                  </div>
                </div>
              </div>
              <Link
                href="/sell"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Create listing
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          {/* Primary column — inventory (like seller hubs on large marketplaces) */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your listings</h2>
                <p className="mt-1 text-sm text-muted">
                  Manage inventory buyers see when they browse ReListed.
                </p>
              </div>
              <Link
                href="/sell"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                New listing
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center shadow-sm">
                <p className="text-base font-semibold text-foreground">No listings yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  Publish your first item—photos and clear descriptions help buyers trust you,
                  just like on other marketplaces.
                </p>
                <Link
                  href="/sell"
                  className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                >
                  Start selling
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {products.map((p) => (
                  <ProfileListingRow
                    key={p.id}
                    product={p}
                    priceLabel={formatUsd(Number(p.price))}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Sidebar — account settings */}
          <aside className="lg:sticky lg:top-24">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Account settings
            </p>
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialName={profile?.full_name ?? ""}
              initialLocation={profile?.location ?? ""}
              initialTelegram={telegram}
              initialPhone={phone}
              initialAvatarUrl={avatarUrl}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
