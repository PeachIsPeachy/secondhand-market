"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markConversationSeen } from "@/app/actions/messages";

export function MarkConversationSeen({
  productId,
  peerId,
}: {
  productId: string;
  peerId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      await markConversationSeen(productId, peerId);
      router.refresh();
    })();
  }, [productId, peerId, router]);

  return null;
}
