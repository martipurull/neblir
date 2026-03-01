import React from "react";

interface ChevronProps {
  direction: "left" | "right";
  className?: string;
}

export function Chevron({ direction, className }: ChevronProps) {
  const pathD = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={pathD} />
    </svg>
  );
}
