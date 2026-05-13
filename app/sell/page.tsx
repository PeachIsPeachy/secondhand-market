import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { createClient } from "@/lib/supabase/server";
import { SetupBanner } from "@/components/SetupBanner";

export const metadata: Metadata = {
  title: "Sell an item | ReListed",
  description: "Create a listing in seconds with photos and clear details.",
};

export default async function SellPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <SetupBanner />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/sell");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Sell an item</h1>
      <p className="mt-2 text-sm text-muted">
        Add photos, set a fair price, and publish to the marketplace.
      </p>
      <div className="mt-8">
        <ListingForm mode="create" profileDefaultLocation={profile?.location ?? null} />
      </div>
    </div>
  );
}
