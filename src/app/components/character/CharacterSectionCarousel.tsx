"use client";

import React from "react";

export interface CharacterSectionSlide {
  id: string;
  title: string;
  children: React.ReactNode;
}

interface CharacterSectionCarouselProps {
  sections: CharacterSectionSlide[];
}

export function CharacterSectionCarousel({
  sections,
}: CharacterSectionCarouselProps) {
  return (
    <div
      className="overflow-x-auto overscroll-x-contain scroll-smooth pb-4"
      style={{ scrollSnapType: "x mandatory" }}
    >
      <div className="flex w-max gap-4 px-4 pt-4">
        {sections.map((section) => (
          <section
            key={section.id}
            className="w-[min(100vw-2rem,28rem)] shrink-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            style={{ scrollSnapAlign: "start" }}
          >
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              {section.title}
            </h2>
            <div className="text-sm text-gray-700">{section.children}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
