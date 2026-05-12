import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileListingRow } from "@/components/ProfileListingRow";
import { ProfileForm } from "@/components/ProfileForm";
import { fetchMyProducts } from "@/lib/data/products";
import { getListingPriceFormatter } from "@/lib/display-currency";
import { createClient } from "@/lib/supabase/server";
import { SetupBanner } from "@/components/SetupBanner";

export const metadata: Metadata = {
  title: "Profile | ReListed",
  description: "Manage your ReListed profile and listings.",
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, location")
    .eq("id", user.id)
    .maybeSingle();

  const { products } = await fetchMyProducts(user.id);
  const { formatUsd } = await getListingPriceFormatter();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your profile</h1>
          <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
        </div>
        <Link
          href="/messages"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-primary-subtle/40"
        >
          Messages
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <ProfileForm
          userId={user.id}
          initialName={profile?.full_name ?? ""}
          initialLocation={profile?.location ?? ""}
        />

        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Your listings</h2>
            <Link
              href="/sell"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              New listing
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              You have no active listings.{" "}
              <Link href="/sell" className="font-semibold text-primary underline underline-offset-2">
                Sell something
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {products.map((p) => (
                <ProfileListingRow
                  key={p.id}
                  product={p}
                  priceLabel={formatUsd(Number(p.price))}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
