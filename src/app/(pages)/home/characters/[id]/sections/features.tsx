"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import Button from "@/app/components/shared/Button";
import React, { useState } from "react";

type FeatureCharacterEntry = NonNullable<CharacterDetail["features"]>[number];

function FeaturesList({ features }: { features: FeatureCharacterEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="space-y-1">
      {features.map((fc) => {
        const isExpanded = expandedId === fc.id;
        const hasDescription =
          fc.feature.description != null && fc.feature.description !== "";

        return (
          <li
            key={fc.id}
            className="rounded border border-black bg-transparent"
          >
            <Button
              type="button"
              variant="lightDisclosureRow"
              fullWidth={false}
              className="w-full"
              onClick={() => setExpandedId(isExpanded ? null : fc.id)}
            >
              <span className="font-medium text-black">
                {fc.feature.name}
                <span className="ml-1.5 text-black/70">(grade {fc.grade})</span>
              </span>
              {hasDescription && (
                <span
                  className="shrink-0 text-xs text-black/70"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "−" : "+"}
                </span>
              )}
            </Button>
            {hasDescription && isExpanded && (
              <div className="border-t border-black px-3 py-2.5 text-sm text-black">
                {fc.feature.description}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function getFeaturesSection(
  character: CharacterDetail
): CharacterSectionSlide | null {
  const raw = character.features;
  if (!raw || raw.length === 0) return null;

  const features = [...raw].sort((a, b) => a.grade - b.grade);

  return {
    id: "features",
    title: "Features",
    children: <FeaturesList features={features} />,
  };
}
