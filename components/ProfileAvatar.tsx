"use client";

import Image from "next/image";

/** Generic silhouette placeholder (Facebook / IG–style neutral glyph). */
function DefaultAvatarSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="50" cy="50" r="50" fill="#E4E6EB" />
      <ellipse cx="50" cy="36" rx="17" ry="17" fill="#BCC0C4" />
      <ellipse cx="50" cy="84" rx="34" ry="27" fill="#BCC0C4" />
    </svg>
  );
}

export function ProfileAvatar({
  src,
  alt,
  sizes,
  className = "",
  priority,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const trimmed = typeof src === "string" ? src.trim() : "";

  const outer = `relative shrink-0 overflow-hidden rounded-full ${className}`.trim();

  if (!trimmed) {
    return (
      <div className={outer}>
        <DefaultAvatarSvg className="h-full w-full" />
        <span className="sr-only">{alt || "Default profile photo"}</span>
      </div>
    );
  }

  return (
    <div className={outer}>
      <Image
        src={trimmed}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}
