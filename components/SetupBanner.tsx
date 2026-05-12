import Link from "next/link";

export function SetupBanner() {
  const onVercel = process.env.VERCEL === "1";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium text-amber-950">Supabase environment variables are missing.</p>
      <p className="mt-1 text-amber-900/80">
        {onVercel ? (
          <>
            In{" "}
            <strong className="font-medium text-amber-950">Vercel → Project → Settings → Environment Variables</strong>, add{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and either{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> or{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
            (from{" "}
            <Link className="font-medium text-primary underline underline-offset-2" href="https://supabase.com/dashboard">
              Supabase
            </Link>{" "}
            → Project Settings → API). Enable them for{" "}
            <strong className="font-medium text-amber-950">Production</strong>, then{" "}
            <strong className="font-medium text-amber-950">Redeploy</strong> — <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_*</code> values are baked in at build time, so a new deploy is required after you add or change them.
          </>
        ) : (
          <>
            Create{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">.env.local</code> with{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and either{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> or{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
            (see{" "}
            <Link className="font-medium text-primary underline underline-offset-2" href="https://supabase.com/dashboard">
              Supabase
            </Link>{" "}
            → Project
            Settings → API). Restart <code className="rounded bg-amber-100/80 px-1 py-0.5 text-xs">npm run dev</code> after saving.
          </>
        )}
      </p>
    </div>
  );
}
