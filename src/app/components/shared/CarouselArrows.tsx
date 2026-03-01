"use client";

import { Chevron } from "@/app/components/shared/Chevron";
import React from "react";

interface CarouselArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function CarouselArrows({
  onPrev,
  onNext,
  disabled = false,
}: CarouselArrowsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous section"
        className="absolute -left-1 top-1/2 z-20 -translate-y-1/2 p-1 transition disabled:pointer-events-none disabled:opacity-40"
        disabled={disabled}
      >
        <Chevron direction="left" className="h-4 w-4 text-black" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next section"
        className="absolute -right-1 top-1/2 z-20 -translate-y-1/2 p-1 transition disabled:pointer-events-none disabled:opacity-40"
        disabled={disabled}
      >
        <Chevron direction="right" className="h-4 w-4 text-black" />
      </button>
    </>
  );
}
