"use client";

import Button from "@/app/components/shared/Button";
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
        <Button
          key={index}
          variant={
            index === currentIndex ? "carouselDotActive" : "carouselDotInactive"
          }
          fullWidth={false}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}`}
          className="rounded-full"
        />
      ))}
    </div>
  );
}
