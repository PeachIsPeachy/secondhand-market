"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  user: { id: string; email: string | null } | null;
};

export function NavbarAuth({ user }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/login"
          className="rounded-lg px-3 py-1.5 font-medium text-muted transition-colors hover:bg-primary-subtle hover:text-primary"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-primary/35 hover:text-foreground"
    >
      Sign out
    </button>
  );
}
