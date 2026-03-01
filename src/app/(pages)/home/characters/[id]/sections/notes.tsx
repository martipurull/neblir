"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";

export function getNotesSection(
  character: CharacterDetail
): CharacterSectionSlide | null {
  const notes = character.notes;
  if (!notes || notes.length === 0) return null;

  return {
    id: "notes",
    title: "Notes",
    children: (
      <ul className="list-disc space-y-1 pl-4">
        {notes.map((note, i) => (
          <li key={i}>{note}</li>
        ))}
      </ul>
    ),
  };
}
