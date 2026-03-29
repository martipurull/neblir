"use client";

import React from "react";

interface CarouselDotsProps {
  currentIndex: number;
  totalCount: number;
  onSelect: (index: number) => void;
}

export function CarouselDots({
  currentIndex,
  totalCount,
  onSelect,
}: CarouselDotsProps) {
  return (
    <div className="mt-2 flex shrink-0 justify-center gap-2 pb-1">
      {Array.from({ length: totalCount }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}`}
          className={`rounded-full transition focus:outline-none focus:ring-0 focus-visible:ring-0 ${
            index === currentIndex
              ? "h-2.5 w-2.5 bg-customPrimary"
              : "h-2 w-2 bg-customSecondary/10"
          }`}
        />
      ))}
    </div>
  );
}
