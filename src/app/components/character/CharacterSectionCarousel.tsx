"use client";

import { CarouselArrows } from "@/app/components/shared/CarouselArrows";
import { CarouselDots } from "@/app/components/shared/CarouselDots";
import { CarouselTrack } from "@/app/components/shared/CarouselTrack";
import { useCarousel } from "@/hooks/use-carousel";
import React from "react";

export interface CharacterSectionSlide {
  id: string;
  title: string;
  /** Rendered opposite the title (e.g. right-aligned) when present */
  titleSupplement?: React.ReactNode;
  children: React.ReactNode;
}

interface CharacterSectionCarouselProps {
  sections: CharacterSectionSlide[];
  className?: string;
}

export function CharacterSectionCarousel({
  sections,
  className,
}: CharacterSectionCarouselProps) {
  const { scrollRef, currentIndex, scrollToIndex } = useCarousel(
    sections.length
  );

  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-col ${className ?? ""}`}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1">
        <CarouselArrows
          onPrev={() => scrollToIndex(currentIndex - 1)}
          onNext={() => scrollToIndex(currentIndex + 1)}
          disabled={sections.length === 0}
        />
        <CarouselTrack ref={scrollRef}>
          {sections.map((section, index) => (
            <section
              key={section.id}
              data-slide-index={index}
              className="flex h-full w-[min(100vw-2rem,28rem)] shrink-0 flex-col rounded-lg border border-black bg-transparent"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="shrink-0 border-b border-black px-4 py-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-black">
                  {section.title}
                </h2>
                {section.titleSupplement != null && (
                  <div className="flex items-center">
                    {section.titleSupplement}
                  </div>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm text-black">
                {section.children}
              </div>
            </section>
          ))}
        </CarouselTrack>
      </div>
      <CarouselDots
        currentIndex={currentIndex}
        totalCount={sections.length}
        onSelect={scrollToIndex}
      />
    </div>
  );
}
