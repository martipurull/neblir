import React from "react";

type ImageLoadingSkeletonVariant = "avatar" | "item" | "currency";

interface ImageLoadingSkeletonProps {
  variant?: ImageLoadingSkeletonVariant;
  className?: string;
}

const variantSvgClassName: Record<ImageLoadingSkeletonVariant, string> = {
  avatar: "h-9 w-9 text-black/25",
  item: "h-9 w-9 text-black/25",
  currency: "h-6 w-6 text-black/25",
};

const variantBackgroundClassName: Record<ImageLoadingSkeletonVariant, string> =
  {
    avatar: "bg-black/10",
    item: "bg-black/10",
    currency: "bg-black/10",
  };

const ImageLoadingSkeleton: React.FC<ImageLoadingSkeletonProps> = ({
  variant = "avatar",
  className = "",
}) => {
  const rootClassName =
    `image-loading-skeleton flex h-full w-full items-center justify-center ${variantBackgroundClassName[variant]} ${className}`.trim();

  return (
    <>
      <div className={rootClassName} aria-hidden="true" role="presentation">
        {variant === "avatar" ? (
          <svg
            viewBox="0 0 48 48"
            className={variantSvgClassName.avatar}
            fill="currentColor"
          >
            <circle cx="24" cy="16" r="8" />
            <path d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16z" />
          </svg>
        ) : variant === "item" ? (
          <svg
            viewBox="0 0 48 48"
            className={variantSvgClassName.item}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 18l12-8 12 8-12 8z" />
            <path d="M12 18v12l12 8 12-8V18" />
            <path d="M24 26v12" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 48 48"
            className={variantSvgClassName.currency}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M26 9v30" />
            <path d="M32 14c-2-2-5-3-8-3-5 0-9 3-9 7 0 9 18 4 18 13 0 4-4 7-9 7-3 0-6-1-8-3" />
          </svg>
        )}
      </div>
      <style jsx>{`
        .image-loading-skeleton {
          animation: image-skeleton-pulse 1.4s ease-in-out infinite;
        }

        @keyframes image-skeleton-pulse {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ImageLoadingSkeleton;
