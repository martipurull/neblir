import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ResourceListCardProps {
  title: string;
  subtitle: React.ReactNode;
  imageUrl?: string | null;
  imageAlt: string;
  placeholder?: React.ReactNode;
  className?: string;
  href?: string;
}

const ResourceListCard: React.FC<ResourceListCardProps> = ({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  placeholder = null,
  className = "",
  href,
}) => {
  const showImage =
    imageUrl && typeof imageUrl === "string" && imageUrl.length > 0;
  const showLoading = imageUrl === undefined;

  const cardContent = (
    <>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={48}
            height={48}
            className="h-12 w-12 object-cover object-top"
          />
        ) : showLoading ? (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
            ...
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
            {placeholder ?? "N/A"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
        <p className="truncate text-xs text-gray-600">{subtitle}</p>
      </div>
    </>
  );

  const baseClassName =
    `flex items-center gap-3 rounded-md border border-gray-200 px-5 py-4 ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={`block transition-colors hover:bg-gray-50 ${baseClassName}`}
      >
        {cardContent}
      </Link>
    );
  }

  return <article className={baseClassName}>{cardContent}</article>;
};

export default ResourceListCard;
