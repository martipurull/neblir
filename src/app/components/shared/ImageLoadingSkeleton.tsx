import React from "react";

type ImageLoadingSkeletonVariant = "avatar" | "item" | "currency" | "cityscape";

interface ImageLoadingSkeletonProps {
  variant?: ImageLoadingSkeletonVariant;
  className?: string;
}

const variantSvgClassName: Record<ImageLoadingSkeletonVariant, string> = {
  avatar: "h-10 w-10 text-black/25",
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
            {/* Zoomed ~22% from center so the figure reads more like a bust / close-up */}
            <g transform="translate(24 24) scale(1.22) translate(-24 -24)">
              {/* Scanner ring — rotates; whole avatar still uses image-skeleton-pulse */}
              <g data-avatar-orbit>
                <circle
                  cx="24"
                  cy="24"
                  r="16"
                  strokeDasharray="6 10 3 42"
                  opacity="0.38"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="13.5"
                  strokeDasharray="1 7"
                  opacity="0.22"
                />
              </g>
              {/* HUD corner brackets */}
              <g opacity="0.32" strokeWidth="1">
                <path d="M9.5 12.5v4M9.5 12.5h4" />
                <path d="M38.5 12.5v4M38.5 12.5h-4" />
                <path d="M9.5 35.5v-4M9.5 35.5h4" />
                <path d="M38.5 35.5v-4M38.5 35.5h-4" />
              </g>
              {/* Tactical helmet — flat crown, no antenna */}
              <path
                strokeWidth="1.55"
                d="M17 18L18 13.5L22 12.5L26 12.5L30 13.5L31 18L31 23L24 26.5L17 23Z"
              />
              {/* Visor — single primary band + subtle lower edge */}
              <path opacity="0.62" d="M18 18.5h12" />
              <path opacity="0.36" d="M19.5 20.5h9" />
              {/* Cheek vents — short vertical ticks */}
              <line x1="15.5" y1="19.5" x2="15.5" y2="21.2" opacity="0.38" />
              <line x1="32.5" y1="19.5" x2="32.5" y2="21.2" opacity="0.38" />
              {/* Neck seal */}
              <path opacity="0.45" d="M20.5 25h7" />
              {/* Pauldrons */}
              <path
                strokeWidth="1.35"
                opacity="0.9"
                d="M13.5 27l-2.5-1-1.2 3.2 2.8 1.8M34.5 27l2.5-1 1.2 3.2-2.8 1.8"
              />
              {/* Torso armor */}
              <path strokeWidth="1.5" d="M17 27.5L15 39L24 41L33 39L31 27.5Z" />
              <line x1="24" y1="28" x2="24" y2="39" opacity="0.35" />
              <path opacity="0.4" d="M19 29.5h10M19 33.5h10" />
              <circle
                cx="24"
                cy="31.5"
                r="2"
                opacity="0.42"
                strokeWidth="1.1"
              />
              <circle
                cx="24"
                cy="31.5"
                r="0.7"
                fill="currentColor"
                strokeWidth="0"
              />
              {/* Hip / leg segments */}
              <path opacity="0.4" d="M17.5 40l-1 3M30.5 40l1 3" />
            </g>
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
          transform-origin: 24px 24px;
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
