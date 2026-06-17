"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import { CHARACTER_SECTION_GRID_RESPONSIVE_CLASS } from "@/app/lib/characterSectionGridLayout";

interface CharacterSectionGridProps {
  sections: CharacterSectionSlide[];
  className?: string;
}

export function CharacterSectionGrid({
  sections,
  className,
}: CharacterSectionGridProps) {
  return (
    <div
      className={`min-h-0 min-w-0 overflow-y-auto px-2 pb-2 pt-4 ${className ?? ""}`}
    >
      <div className={CHARACTER_SECTION_GRID_RESPONSIVE_CLASS}>
        {sections.map((section) => (
          <section
            key={section.id}
            className="flex min-h-0 flex-col rounded-lg border border-black bg-transparent"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black px-4 py-3">
              <h2 className="text-base font-semibold text-black">
                {section.title}
              </h2>
              {section.titleSupplement != null && (
                <div className="flex items-center">
                  {section.titleSupplement}
                </div>
              )}
            </div>
            <div className="p-4 text-sm text-black">{section.children}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
