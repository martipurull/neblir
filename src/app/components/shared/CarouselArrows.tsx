"use client";

import Button from "@/app/components/shared/Button";
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
      <Button
        variant="carouselArrow"
        fullWidth={false}
        type="button"
        onClick={onPrev}
        aria-label="Previous section"
        className="absolute -left-1 top-1/2 z-20 -translate-y-1/2"
        disabled={disabled}
      >
        <Chevron direction="left" className="h-4 w-4 text-black" />
      </Button>
      <Button
        variant="carouselArrow"
        fullWidth={false}
        type="button"
        onClick={onNext}
        aria-label="Next section"
        className="absolute -right-1 top-1/2 z-20 -translate-y-1/2"
        disabled={disabled}
      >
        <Chevron direction="right" className="h-4 w-4 text-black" />
      </Button>
    </>
  );
}
