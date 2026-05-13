"use client";

type Listener = (count: number) => void;

const listeners = new Set<Listener>();

export function subscribeUnreadCount(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Broadcast unread total from network polls so nav badges stay in sync without duplicate intervals. */
export function broadcastUnreadCount(count: number) {
  listeners.forEach((fn) => fn(count));
}
