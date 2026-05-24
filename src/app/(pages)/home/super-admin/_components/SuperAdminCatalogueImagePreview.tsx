"use client";

import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import { useMemo } from "react";

type SuperAdminCatalogueImagePreviewProps = {
  imageKey: string;
  alt: string;
  /** Tailwind size classes for the preview box (default 7rem square). */
  sizeClassName?: string;
};

export function SuperAdminCatalogueImagePreview({
  imageKey,
  alt,
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

  return (
    <div className={`overflow-hidden bg-transparent mt-2 ${sizeClassName}`}>
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
