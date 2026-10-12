"use client";

import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";

type ItemDetailPictureProps = {
  imageKey?: string | null;
  /** Signed URL. `undefined` is still loading; `null` failed or is absent. */
  imageUrl?: string | null;
  /** Item name used in the accessible link label. */
  name: string;
  className?: string;
};

/**
 * Item-details thumbnail. When a signed URL is available, the picture opens
 * that image in a new tab. A missing image key renders nothing.
 */
export function ItemDetailPicture({
  imageKey,
  imageUrl,
  name,
  className,
}: ItemDetailPictureProps) {
  if (!imageKey) return null;

  const boxClassName =
    `h-20 w-20 shrink-0 overflow-hidden rounded-lg ${className ?? ""}`.trim();

  if (imageUrl) {
    return (
      <a
        href={imageUrl}
        target="_blank"
        rel="noreferrer"
        className={`${boxClassName} block focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
      >
        <span className="sr-only">Open {name} image</span>
        <SignedRemoteImage
          src={imageUrl}
          imageKey={imageKey}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 object-cover object-center"
        />
      </a>
    );
  }

  return (
    <div className={boxClassName}>
      {imageUrl === undefined ? <ImageLoadingSkeleton variant="item" /> : null}
    </div>
  );
}
