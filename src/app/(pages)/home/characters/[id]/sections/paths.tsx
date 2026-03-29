"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import { PathsList } from "@/app/components/character/PathsList";
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
    children: <PathsList paths={paths} />,
  };
}
