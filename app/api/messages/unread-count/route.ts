import { NextResponse } from "next/server";
import { fetchUnreadInboundTotal } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ count: 0 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await fetchUnreadInboundTotal(user.id);
  return NextResponse.json({ count });
}
