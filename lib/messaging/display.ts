export function initialsFromName(name: string | null | undefined): string {
  const t = name?.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      (parts[0][0] ?? "").toUpperCase() + (parts[parts.length - 1][0] ?? "").toUpperCase()
    );
  }
  return t.slice(0, 2).toUpperCase();
}

/** Normalize Telegram username/handle to a t.me URL */
export function telegramPublicUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim().replace(/^@/, "");
  if (!t) return null;
  return `https://t.me/${encodeURIComponent(t)}`;
}
