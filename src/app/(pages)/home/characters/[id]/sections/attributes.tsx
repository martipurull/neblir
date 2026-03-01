"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAttributesSection(
  character: CharacterDetail
): CharacterSectionSlide {
  const attrs = character.innateAttributes;
  const mental: (keyof typeof attrs)[] = [
    "intelligence",
    "wisdom",
    "personality",
  ];
  const physical: (keyof typeof attrs)[] = [
    "strength",
    "dexterity",
    "constitution",
  ];

  const renderAttributeGroup = (
    groupLabel: string,
    attributeKeys: (keyof typeof attrs)[]
  ) => (
    <div key={groupLabel} className="space-y-4">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        {groupLabel}
      </span>
      <div className="space-y-4">
        {attributeKeys.map((attrKey) => {
          const group = attrs[attrKey];
          if (typeof group !== "object" || group === null) return null;
          const entries = Object.entries(group as Record<string, number>) as [
            string,
            number,
          ][];
          return (
            <div key={attrKey} className="space-y-1.5">
              <span className="text-xs font-medium text-black">
                {formatLabel(attrKey)}
              </span>
              <ul className="divide-y divide-black rounded border border-black">
                {entries.map(([key, value]) => (
                  <li key={key}>
                    <button
                      type="button"
                      data-attribute-group={attrKey}
                      data-skill={key}
                      className="flex w-full items-baseline justify-between gap-4 px-3 py-2.5 text-left transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
                    >
                      <span className="text-sm text-black">
                        {formatLabel(key)}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-black">
                        {value}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );

  return {
    id: "attributes",
    title: "Attributes",
    children: (
      <div className="space-y-8">
        {renderAttributeGroup("Mental Attributes", mental)}
        {renderAttributeGroup("Physical Attributes", physical)}
      </div>
    ),
  };
}
