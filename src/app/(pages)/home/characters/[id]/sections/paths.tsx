"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";

export function getPathsSection(
  character: CharacterDetail
): CharacterSectionSlide | null {
  const paths = character.paths;
  if (!paths || paths.length === 0) return null;

  return {
    id: "paths",
    title: "Paths",
    children: (
      <ul className="space-y-1">
        {paths.map((path) => (
          <li key={path.id}>
            <span className="font-medium">{String(path.name)}</span>
            {path.description && (
              <p className="mt-0.5 text-black">{path.description}</p>
            )}
          </li>
        ))}
      </ul>
    ),
  };
}
