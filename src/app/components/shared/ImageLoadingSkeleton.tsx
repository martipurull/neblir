import React from "react";

type ImageLoadingSkeletonVariant = "avatar" | "item" | "currency" | "cityscape";

interface ImageLoadingSkeletonProps {
  variant?: ImageLoadingSkeletonVariant;
  className?: string;
}

const variantSvgClassName: Record<ImageLoadingSkeletonVariant, string> = {
  avatar: "h-9 w-9 text-black/25",
  item: "h-9 w-9 text-black/25",
  currency: "h-6 w-6 text-black/25",
  cityscape: "h-7 w-7 text-black/25",
};

const variantBackgroundClassName: Record<ImageLoadingSkeletonVariant, string> =
  {
    avatar: "bg-black/10",
    item: "bg-black/10",
    currency: "bg-black/10",
    cityscape: "bg-black/10",
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
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g data-avatar-orbit>
              <circle
                cx="24"
                cy="23"
                r="15.5"
                strokeDasharray="5 54"
                opacity="0.4"
              />
            </g>
            <path strokeWidth="1.5" d="M17 9h14l6 6v18l-6 6H17l-6-6V15z" />
            <path opacity="0.38" d="M20 12h8l4 4v16l-4 4h-8l-4-4V16z" />
            <line x1="17" y1="25" x2="31" y2="25" opacity="0.55" />
            <circle
              cx="20"
              cy="21"
              r="1.35"
              fill="currentColor"
              strokeWidth="0"
            />
            <circle
              cx="28"
              cy="21"
              r="1.35"
              fill="currentColor"
              strokeWidth="0"
            />
            <path opacity="0.45" d="M14 37c3.5-4 6.5-5 10-5s6.5 1 10 5" />
            <line x1="24" y1="9" x2="24" y2="11.5" opacity="0.5" />
            <line x1="24" y1="36.5" x2="24" y2="39" opacity="0.5" />
            <line x1="11" y1="23" x2="13.5" y2="23" opacity="0.5" />
            <line x1="34.5" y1="23" x2="37" y2="23" opacity="0.5" />
          </svg>
        ) : variant === "item" ? (
          <svg
            viewBox="0 0 48 48"
            className={variantSvgClassName.item}
            fill="currentColor"
          >
            {/* L-piece: Γ shape (4 cells) — top bar + stem; outer g = rest position */}
            <g transform="translate(6, 10)">
              <g data-piece="l">
                <g transform="translate(0, 0)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
                <g transform="translate(9, 0)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
                <g transform="translate(18, 0)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
                <g transform="translate(18, 9)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
              </g>
            </g>
            {/* I-piece: 3 cells vertical, flush to the right of the L */}
            <g transform="translate(33, 10)">
              <g data-piece="i">
                <g transform="translate(0, 0)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
                <g transform="translate(0, 9)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
                <g transform="translate(0, 18)">
                  <circle cx="2.6" cy="1.35" r="1.2" />
                  <circle cx="5.9" cy="1.35" r="1.2" />
                  <rect x="0" y="2.4" width="8.5" height="6.1" rx="1.1" />
                </g>
              </g>
            </g>
          </svg>
        ) : variant === "currency" ? (
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
        ) : (
          <svg
            viewBox="0 0 48 48"
            className={variantSvgClassName.cityscape}
            fill="currentColor"
          >
            <rect x="1" y="29" width="4" height="11" rx="0.75" />
            <rect x="5" y="25" width="3" height="15" rx="0.75" />
            <rect x="8" y="31" width="2" height="9" rx="0.5" />
            <rect x="10" y="13" width="5" height="27" rx="0.75" />
            <rect x="12" y="8" width="1" height="6" rx="0.25" />
            <rect x="15" y="21" width="3" height="19" rx="0.75" />
            <rect x="18" y="26" width="4" height="14" rx="0.75" />
            <rect x="22" y="33" width="2" height="7" rx="0.5" />
            <rect x="24" y="19" width="5" height="21" rx="0.75" />
            <rect x="25" y="14" width="3" height="6" rx="0.5" />
            <rect x="29" y="24" width="4" height="16" rx="0.75" />
            <rect x="33" y="16" width="4" height="24" rx="0.75" />
            <rect x="37" y="28" width="3" height="12" rx="0.75" />
            <rect x="40" y="30" width="7" height="10" rx="0.75" />
            <rect x="35" y="12" width="2" height="5" rx="0.35" />
            <g fill="rgba(255,255,255,0.22)">
              <rect x="11" y="17" width="1.5" height="1.5" />
              <rect x="13" y="20" width="1.5" height="1.5" />
              <rect x="12" y="24" width="1.5" height="1.5" />
              <rect x="14" y="28" width="1.5" height="1.5" />
              <rect x="11" y="31" width="1.5" height="1.5" />
              <rect x="16" y="24" width="1.5" height="1.5" />
              <rect x="16" y="29" width="1.5" height="1.5" />
              <rect x="19" y="29" width="1.5" height="1.5" />
              <rect x="20" y="33" width="1.5" height="1.5" />
              <rect x="25" y="22" width="1.5" height="1.5" />
              <rect x="27" y="26" width="1.5" height="1.5" />
              <rect x="26" y="31" width="1.5" height="1.5" />
              <rect x="30" y="27" width="1.5" height="1.5" />
              <rect x="31" y="32" width="1.5" height="1.5" />
              <rect x="34" y="20" width="1.5" height="1.5" />
              <rect x="35" y="24" width="1.5" height="1.5" />
              <rect x="34" y="29" width="1.5" height="1.5" />
              <rect x="36" y="33" width="1.5" height="1.5" />
              <rect x="38" y="31" width="1.5" height="1.5" />
              <rect x="41" y="33" width="1.5" height="1.5" />
              <rect x="44" y="35" width="1.5" height="1.5" />
              <rect x="6" y="28" width="1.5" height="1.5" />
              <rect x="2" y="33" width="1.5" height="1.5" />
            </g>
          </svg>
        )}
      </div>
      <style jsx>{`
        .image-loading-skeleton {
          animation: image-skeleton-pulse 1.4s ease-in-out infinite;
        }

        .image-loading-skeleton svg g[data-avatar-orbit] {
          transform-origin: 24px 23px;
          animation: avatar-skeleton-orbit 5s linear infinite;
        }

        .image-loading-skeleton svg g[data-piece="l"] {
          transform-origin: 13px 9px;
          animation: item-skeleton-piece-l 1.65s ease-in-out infinite alternate;
        }

        .image-loading-skeleton svg g[data-piece="i"] {
          transform-origin: 4.25px 14px;
          animation: item-skeleton-piece-i 1.65s ease-in-out infinite alternate;
          animation-delay: 0.1s;
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

        @keyframes avatar-skeleton-orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes item-skeleton-piece-l {
          0% {
            transform: translate(10px, 7px);
          }
          100% {
            transform: translate(0, 0);
          }
        }

        @keyframes item-skeleton-piece-i {
          0% {
            transform: translate(-11px, -9px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
      `}</style>
    </>
  );
};

export default ImageLoadingSkeleton;
