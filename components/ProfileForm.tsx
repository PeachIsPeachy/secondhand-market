"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  userId,
  initialName,
  initialLocation,
}: {
  userId: string;
  initialName: string;
  initialLocation: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        location: location.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      setStatus("error");
      return;
    }
    setStatus("done");
    setMessage("Profile updated.");
  }

  return (
    <form
      onSubmit={(e) => void save(e)}
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-foreground">Profile</h2>
      <div>
        <label className="block text-xs font-medium text-muted">Display name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted">Location (optional)</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, region"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      {message && (
        <p
          className={
            status === "error"
              ? "text-sm text-red-700"
              : "text-sm font-medium text-emerald-700"
          }
        >
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
