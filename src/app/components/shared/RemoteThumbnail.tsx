"use client";

import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { resolveRemoteImageUrl } from "@/app/lib/remoteImageUrl";

type RemoteThumbnailVariant = "item" | "vehicle";

type RemoteThumbnailProps = {
  imageUrl: string | null | undefined;
  imageKey?: string | null;
  alt?: string;
  size?: number;
  variant?: RemoteThumbnailVariant;
  className?: string;
};

const skeletonSvgClassBySize: Record<number, string> = {
  32: "[&_svg]:h-7 [&_svg]:w-7",
  36: "[&_svg]:h-8 [&_svg]:w-8",
  44: "[&_svg]:h-9 [&_svg]:w-9",
  48: "[&_svg]:h-10 [&_svg]:w-10",
};

/** Square catalogue thumbnail with item/vehicle placeholder art (not character avatar). */
export function RemoteThumbnail({
  imageUrl,
  imageKey,
  alt = "",
  size = 32,
  variant = "item",
  className,
}: RemoteThumbnailProps) {
  const resolved = resolveRemoteImageUrl(imageKey, imageUrl);
  const skeletonClassName = [
    "h-full w-full",
    skeletonSvgClassBySize[size] ?? "[&_svg]:h-7 [&_svg]:w-7",
  ].join(" ");

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md bg-paleBlue/20 ${className ?? ""}`.trim()}
      style={{ width: size, height: size }}
    >
      {resolved ? (
        <SignedRemoteImage
          src={resolved}
          imageKey={imageKey ?? undefined}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover object-center"
        />
      ) : resolved === undefined ? (
        <ImageLoadingSkeleton variant={variant} className={skeletonClassName} />
      ) : (
        <ImageLoadingSkeleton
          variant={variant}
          animated={false}
          className={skeletonClassName}
        />
      )}
    </div>
  );
}
