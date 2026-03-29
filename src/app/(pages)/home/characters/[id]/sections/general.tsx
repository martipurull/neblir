"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import React from "react";
import { KeyValueRow } from "./section-shared";

export function getGeneralSection(
  character: CharacterDetail
): CharacterSectionSlide {
  const generalInfo = character.generalInformation;
  const entries = [
    {
      label: "Name",
      value: [generalInfo.name, generalInfo.surname].filter(Boolean).join(" "),
    },
    { label: "Age", value: String(generalInfo.age) },
    { label: "Profession", value: generalInfo.profession },
    { label: "Race", value: generalInfo.race },
    { label: "Religion", value: generalInfo.religion },
    { label: "Birthplace", value: generalInfo.birthplace },
    { label: "Height", value: `${generalInfo.height} cm` },
    { label: "Weight", value: `${generalInfo.weight} kg` },
  ];

  return {
    id: "general",
    title: "General Information",
    children: (
      <ul className="divide-y divide-black">
        {entries.map(({ label, value }) => (
          <KeyValueRow key={label} label={label} value={value} />
        ))}
      </ul>
    ),
  };
}
