"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeUnreadCount } from "@/lib/client/unread-messages-bus";

export function MessagesNavItem({
  initialCount,
  className,
}: {
  initialCount: number;
  className?: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => subscribeUnreadCount(setCount), []);

  return (
    <Link
      href="/messages"
      className={`relative inline-flex items-center pr-2 pt-0.5 ${className ?? ""}`}
    >
      Messages
      {count > 0 ? (
        <span className="absolute -right-2.5 -top-1.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-sm sm:-right-2.5 sm:-top-1.5">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
