import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Clears Supabase auth cookies from the server response (reliable with SSR). */
export async function POST(request: Request) {
  const { url: sbUrl, key } = getSupabasePublicEnv();
  if (!sbUrl || !key) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(sbUrl, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.signOut({ scope: "global" });

  return NextResponse.redirect(new URL("/", request.url));
}
