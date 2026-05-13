"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CambodiaLocationSelect } from "@/components/CambodiaLocationSelect";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  formatKhLocation,
  parseKhLocation,
} from "@/lib/data/cambodia-locations";

const AVATAR_BUCKET = "avatars";

function extFromFile(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function fieldsFromStoredLocation(stored: string) {
  const p = parseKhLocation(stored.trim());
  return { province: p?.province ?? "", city: p?.city ?? "" };
}

export function ProfileForm({
  userId,
  email,
  initialName,
  initialLocation,
  initialTelegram,
  initialPhone,
  initialAvatarUrl,
}: {
  userId: string;
  email: string;
  initialName: string;
  initialLocation: string;
  initialTelegram: string;
  initialPhone: string;
  initialAvatarUrl: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(initialName);
  const [province, setProvince] = useState(
    () => fieldsFromStoredLocation(initialLocation).province
  );
  const [city, setCity] = useState(() => fieldsFromStoredLocation(initialLocation).city);
  const [telegram, setTelegram] = useState(initialTelegram);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl.trim());
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setFullName(initialName);
    const loc = fieldsFromStoredLocation(initialLocation);
    setProvince(loc.province);
    setCity(loc.city);
    setTelegram(initialTelegram);
    setPhone(initialPhone);
    setAvatarUrl(initialAvatarUrl.trim());
  }, [initialName, initialLocation, initialTelegram, initialPhone, initialAvatarUrl]);

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setMessage(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please use JPG, PNG, or WebP.");
      setStatus("error");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Photo must be under 3 MB.");
      setStatus("error");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      setMessage("Session mismatch.");
      setUploading(false);
      setStatus("error");
      return;
    }

    const path = `${userId}/avatar.${extFromFile(file)}`;
    const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (upErr) {
      setMessage(upErr.message);
      setUploading(false);
      setStatus("error");
      return;
    }

    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);

    if (dbErr) {
      setMessage(dbErr.message);
      setUploading(false);
      setStatus("error");
      return;
    }

    setAvatarUrl(url);
    setUploading(false);
    setStatus("done");
    setMessage("Photo updated.");
    router.refresh();
  }

  async function clearAvatar() {
    setMessage(null);
    setUploading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);
    setUploading(false);
    if (error) {
      setMessage(error.message);
      setStatus("error");
      return;
    }
    setAvatarUrl("");
    setStatus("done");
    setMessage("Photo removed.");
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMessage(null);
    const supabase = createClient();
    const tg = telegram.trim().replace(/^@/, "") || null;
    const locStr = formatKhLocation(province, city);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        location: locStr,
        telegram: tg,
        phone: phone.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      setStatus("error");
      return;
    }
    setStatus("done");
    setMessage("Profile saved.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Profile photo</h2>
      
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar
            src={avatarUrl || null}
            alt=""
            sizes="112px"
            className="size-28 bg-background ring-2 ring-border"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void uploadAvatar(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary-subtle/35 disabled:opacity-60"
            >
              {uploading ? "Working…" : "Upload photo"}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void clearAvatar()}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:text-red-700 disabled:opacity-60"
              >
                Remove
              </button>
            ) : null}
            <p className="w-full text-[11px] text-muted">Square photos look best · JPG / PNG / WebP · max 3 MB</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => void save(e)}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Public profile & contact
          </h2>
          <p className="mt-1 text-xs text-muted">
            Information buyers see on your shop page. Your email stays private unless you share it.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted">Sign-in email</label>
          <p className="mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted">
            {email}
          </p>
        </div>

        <div>
          <label htmlFor="pf-name" className="block text-xs font-medium text-muted">
            Display name
          </label>
          <input
            id="pf-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">
            Location <span className="font-normal opacity-80">(optional)</span>
          </label>
         
          {initialLocation.trim() && !parseKhLocation(initialLocation) ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
              Previous text location: &quot;{initialLocation}&quot;. Choose province and city below to
              replace it with a structured address.
            </p>
          ) : null}
          <div className="mt-3">
            <CambodiaLocationSelect
              province={province}
              city={city}
              onProvinceChange={setProvince}
              onCityChange={setCity}
              provinceId="pf-kh-province"
              cityId="pf-kh-city"
            />
          </div>
        </div>
        <div>
          <label htmlFor="pf-tg" className="block text-xs font-medium text-muted">
            Telegram <span className="font-normal opacity-80">(optional)</span>
          </label>
          <input
            id="pf-tg"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1 text-[11px] text-muted">
            We&apos;ll link to Telegram from your public seller page (buyers still message through
            ReListed first).
          </p>
        </div>
        <div>
          <label htmlFor="pf-phone" className="block text-xs font-medium text-muted">
            Phone <span className="font-normal opacity-80">(optional)</span>
          </label>
          <input
            id="pf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555…"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
