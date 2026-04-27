"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  getSpecialAbilityLabel,
  resolveSpecialAbilityForRace,
} from "@/app/lib/specialAbility";
import React from "react";
import { KeyValueRow } from "./section-shared";

export function getGeneralSection(
  character: CharacterDetail
): CharacterSectionSlide {
  const generalInfo = character.generalInformation;
  const specialAbility =
    generalInfo.specialAbility ??
    resolveSpecialAbilityForRace(generalInfo.race, undefined);
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
    {
      label: "Special Ability",
      value: (
        <span className="inline-flex flex-col items-end gap-1 text-right">
          <span>
            <span className="text-xs">{generalInfo.race}:</span>{" "}
            {getSpecialAbilityLabel(specialAbility.name)}
          </span>
          <span className="max-w-xs text-xs text-black/70">
            {specialAbility.description}
          </span>
        </span>
      ),
      multilineValue: true,
    },
  ];

  return {
    id: "general",
    title: "General Information",
    children: (
      <ul className="divide-y divide-black">
        {entries.map(({ label, value, multilineValue }) => (
          <KeyValueRow
            key={label}
            label={label}
            value={value}
            multilineValue={multilineValue}
          />
        ))}
      </ul>
    ),
  };
}
