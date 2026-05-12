"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type GalleryImage = { id: string; src: string };

export function ListingImageGallery({
  images,
  sizesGrid,
}: {
  images: GalleryImage[];
  sizesGrid: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);

  const showPrev = useCallback(() => {
    setOpen((i) => {
      if (i === null || images.length === 0) return i;
      return i > 0 ? i - 1 : images.length - 1;
    });
  }, [images.length]);

  const showNext = useCallback(() => {
    setOpen((i) => {
      if (i === null || images.length === 0) return i;
      return i < images.length - 1 ? i + 1 : 0;
    });
  }, [images.length]);

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, showPrev, showNext]);

  if (images.length === 0) return null;

  const gridCols = images.length <= 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";

  return (
    <>
      <div className={`grid w-full gap-3 ${gridCols}`}>
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] w-full cursor-zoom-in rounded-2xl bg-background text-left ring-1 ring-transparent transition hover:ring-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={img.src}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes={sizesGrid}
              quality={92}
              priority={i === 0}
            />
            <span className="sr-only">
              Open image {i + 1} of {images.length} full screen
            </span>
          </button>
        ))}
      </div>

      {open !== null && images[open] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Full size photo"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/88"
            aria-label="Close"
            onClick={close}
          />
          <div className="relative z-10 flex w-full max-w-6xl flex-col gap-4">
            <div className="relative mx-auto h-[min(85vh,920px)] w-full">
              <Image
                src={images[open].src}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                quality={95}
                priority
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      showPrev();
                    }}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    Previous
                  </button>
                  <span className="text-xs tabular-nums text-white/90">
                    {open + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      showNext();
                    }}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    Next
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-lg"
              >
                Close
              </button>
            </div>
            <p className="text-center text-[11px] text-white/70">
              Esc to close · Arrow keys to browse
            </p>
          </div>
        </div>
      )}
    </>
  );
}
