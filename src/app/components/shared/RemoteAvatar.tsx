"use client";

import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { PortraitCross } from "@/app/components/shared/PortraitCross";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { resolveRemoteImageUrl } from "@/app/lib/remoteImageUrl";
import type { Status } from "@prisma/client";

type RemoteAvatarProps = {
  imageUrl: string | null | undefined;
  imageKey?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  status?: Status | null;
  /** When set, a resolved image opens in a new tab under this accessible name. */
  openFullImageLabel?: string;
};

const skeletonSvgClassBySize: Record<number, string> = {
  32: "[&_svg]:h-8 [&_svg]:w-8",
  36: "[&_svg]:h-9 [&_svg]:w-9",
  44: "[&_svg]:h-11 [&_svg]:w-11",
  48: "[&_svg]:h-12 [&_svg]:w-12",
  112: "[&_svg]:h-28 [&_svg]:w-28",
};

export function RemoteAvatar({
  imageUrl,
  imageKey,
  alt = "",
  size = 44,
  className,
  status,
  openFullImageLabel,
}: RemoteAvatarProps) {
  const resolved = resolveRemoteImageUrl(imageKey, imageUrl);
  const skeletonClassName = [
    "h-full w-full",
    skeletonSvgClassBySize[size] ?? "[&_svg]:h-11 [&_svg]:w-11",
  ].join(" ");

  const portrait = resolved ? (
    <SignedRemoteImage
      src={resolved}
      imageKey={imageKey ?? undefined}
      alt={alt}
      width={size}
      height={size}
      className="h-full w-full object-cover object-top"
    />
  ) : resolved === undefined ? (
    <ImageLoadingSkeleton variant="avatar" className={skeletonClassName} />
  ) : (
    <ImageLoadingSkeleton
      variant="avatar"
      animated={false}
      className={skeletonClassName}
    />
  );

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-paleBlue/20 ${className ?? ""}`.trim()}
      style={{ width: size, height: size }}
    >
      {resolved && openFullImageLabel ? (
        <a
          href={resolved}
          target="_blank"
          rel="noreferrer"
          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label={openFullImageLabel}
          title="Open full avatar image"
        >
          {portrait}
        </a>
      ) : (
        portrait
      )}
      <PortraitCross status={status} />
    </div>
  );
}
