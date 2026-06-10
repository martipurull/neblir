import Link from "next/link";
import React from "react";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";

interface ResourceListCardProps {
  title: string;
  subtitle: React.ReactNode;
  imageUrl?: string | null;
  imageKey?: string | null;
  imageAlt: string;
  className?: string;
  href?: string;
  rightAccessory?: React.ReactNode;
  body?: React.ReactNode;
}

const ResourceListCard: React.FC<ResourceListCardProps> = ({
  title,
  subtitle,
  imageUrl,
  imageKey,
  imageAlt,
  className = "",
  href,
  rightAccessory,
  body,
}) => {
  const showImage =
    imageUrl && typeof imageUrl === "string" && imageUrl.length > 0;
  const showLoading = imageUrl === undefined;

  const headerRow = (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
        {showImage ? (
          <SignedRemoteImage
            src={imageUrl}
            imageKey={imageKey ?? undefined}
            alt={imageAlt}
            width={48}
            height={48}
            className="h-12 w-12 object-cover object-top"
          />
        ) : showLoading ? (
          <ImageLoadingSkeleton variant="avatar" />
        ) : (
          <ImageLoadingSkeleton
            variant="avatar"
            animated={false}
            className="h-full w-full [&_svg]:h-12 [&_svg]:w-12"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">{title}</p>
        <p className="truncate text-xs text-black">{subtitle}</p>
      </div>
      {rightAccessory ? <div className="shrink-0">{rightAccessory}</div> : null}
    </div>
  );

  const shellClassName = `rounded-md border border-black ${className}`.trim();
  const headerLinkClassName =
    "block px-5 pt-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30";
  const headerStaticClassName = "px-5 pt-4";
  const bodyClassName = "px-5 pb-4 text-sm text-black/80";

  if (href) {
    return (
      <article className={shellClassName}>
        <Link
          href={href}
          className={[headerLinkClassName, body ? "pb-2" : "pb-4"].join(" ")}
        >
          {headerRow}
        </Link>
        {body ? <div className={bodyClassName}>{body}</div> : null}
      </article>
    );
  }

  return (
    <article className={shellClassName}>
      <div
        className={[headerStaticClassName, body ? "pb-2" : "pb-4"].join(" ")}
      >
        {headerRow}
      </div>
      {body ? <div className={bodyClassName}>{body}</div> : null}
    </article>
  );
};

export { ResourceListCard };
