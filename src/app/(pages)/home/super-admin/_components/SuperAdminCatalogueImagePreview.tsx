"use client";

import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import { useMemo } from "react";

type SuperAdminCatalogueImagePreviewProps = {
  imageKey: string;
  alt: string;
  /** Thumbnail for item headers; map matches the public maps list (full width, open in new tab). */
  variant?: "thumbnail" | "map";
  /** Tailwind size classes for the thumbnail preview box (default 7rem square). */
  sizeClassName?: string;
};

export function SuperAdminCatalogueImagePreview({
  imageKey,
  alt,
  variant = "thumbnail",
  sizeClassName = "h-28 w-28",
}: SuperAdminCatalogueImagePreviewProps) {
  const imageEntries = useMemo(
    () => (imageKey ? [{ id: "catalogue-preview", imageKey }] : []),
    [imageKey]
  );
  const imageUrls = useImageUrls(imageEntries);
  const url = imageKey ? imageUrls["catalogue-preview"] : null;

  if (!imageKey) {
    return null;
  }

  if (variant === "map") {
    return (
      <div className="mb-4">
        {url ? (
          <>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block w-full overflow-hidden rounded-md border border-black/20 bg-black/5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <span className="sr-only">Open {alt} image</span>
              <span className="block w-full">
                <Image
                  src={url}
                  alt={alt}
                  width={1600}
                  height={900}
                  sizes="(max-width: 768px) 100vw, 1024px"
                  className="h-auto max-h-[70vh] w-full object-contain"
                  unoptimized
                />
              </span>
            </a>
            <p className="mt-2 text-xs text-black/60">
              Tap or click the map to open the full image.
            </p>
          </>
        ) : url === undefined ? (
          <div className="block h-56 overflow-hidden rounded-md border border-black/20 bg-black/5">
            <ImageLoadingSkeleton variant="cityscape" className="!bg-black/5" />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border border-black/20 bg-black/5 px-4 text-sm text-black/60">
            Map image unavailable.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mt-2 overflow-hidden bg-transparent ${sizeClassName}`}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          width={112}
          height={112}
          className={`${sizeClassName} object-cover object-center`}
          unoptimized
        />
      ) : url === undefined ? (
        <ImageLoadingSkeleton variant="item" className={sizeClassName} />
      ) : null}
    </div>
  );
}
