interface UpArrowIconProps {
  className?: string;
  /** Inherits `currentColor`; thin default reads like the reference artwork. */
  strokeWidth?: number;
}

/**
 * Upgrade / level-up style mark (after common “stacked bars + up arrow” assets):
 * two horizontal rungs, a centered stem, and an open arrowhead pointing up —
 * stroke only, no fill.
 */
export function UpArrowIcon({
  className,
  strokeWidth = 1.5,
}: UpArrowIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Lower + upper platform (matches the wide rects in the reference) */}
      <path d="M 4.5 20.5 h 15 M 4.5 17.25 h 15" />
      {/* Shaft from the upper platform */}
      <path d="M 12 17.25 V 9.25" />
      {/* Upward chevron */}
      <path d="M 12 6.5 L 8.85 10.25 M 12 6.5 L 15.15 10.25" />
    </svg>
  );
}
